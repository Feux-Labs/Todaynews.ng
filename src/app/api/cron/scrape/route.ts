import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeScholarships, scrapeJapa, scrapeMakeMoneyOnline, enrichAndRankStories, stripCompetitorLinksAndBoilerplate, isDuplicateStory, getRecentArticleTitles } from "@/lib/scraper";
import { paraphraseNews, localProceduralRewriter, cleanAndFormatTitle } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { sendNewStoryAlert } from "@/lib/mailer";
import { notifyNewPublish } from "@/lib/push";
import { getPersistentServerSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  // If no secret is configured, allow (local dev / Vercel internal)
  if (!cronSecret) return true;
  const authHeader = req.headers.get("authorization") || "";
  const cronKey = req.headers.get("x-cron-key") || "";
  return authHeader === `Bearer ${cronSecret}` || cronKey === cronSecret;
}

async function storyAlreadyExists(sourceUrl: string, title: string, recentTitles: string[]) {
  if (isDbConfigured()) {
    try {
      const existing = await prisma.article.findFirst({
        where: { sourceUrl },
        select: { id: true },
      });
      if (existing) return true;
    } catch (err) {
      console.error("[Cron Scraper] Duplicate DB check failed; using memory fallback.", err);
    }
  } else {
    const memoryArticles = await memoryDb.getArticles(undefined, undefined, 1, 100);
    if ((memoryArticles.articles || []).some((article: any) => article.sourceUrl === sourceUrl)) return true;
  }

  // Fuzzy check — catches reworded rewrites of a story we already ran, not just exact matches.
  return isDuplicateStory(title, { existingTitles: recentTitles });
}

/**
 * Scheduled Auto-Scraper Endpoint
 * Triggered 7x/day by the GitHub Actions workflow (.github/workflows/scrape-cron.yml)
 * — not Vercel cron, which is capped at once/day on the Hobby plan.
 * Scrapes fresh news worldwide → Paraphrases with Gemini → Saves to AI_PENDING inbox → Mails Admin.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron Scraper] Starting scheduled auto-scrape cycle...");
    const settings = await getPersistentServerSettings();
    let publishedScheduled = 0;
    let autoPublished = 0;

    if (isDbConfigured()) {
      try {
        const due = await prisma.article.updateMany({
          where: {
            status: "SCHEDULED" as any,
            scheduledAt: { lte: new Date() },
          },
          data: {
            status: "PUBLISHED" as any,
            scheduledAt: null,
          },
        });
        publishedScheduled = due.count;
      } catch (err) {
        console.error("[Cron Scraper] Scheduled publish check skipped:", err);
      }
    }

    // Auto-publish articles that have been in AI_PENDING for more than 60 minutes
    // (in practice: pending from the previous scheduled run, since runs are
    // now hours apart — see .github/workflows/scrape-cron.yml)
    if (isDbConfigured()) {
      try {
        const sixtyMinsAgo = new Date(Date.now() - 60 * 60 * 1000);
        const duePending = await prisma.article.findMany({
          where: { status: "AI_PENDING" as any, createdAt: { lte: sixtyMinsAgo } },
          select: { id: true, title: true, slug: true, summary: true },
        });
        if (duePending.length > 0) {
          await prisma.article.updateMany({
            where: { id: { in: duePending.map((a) => a.id) } },
            data: { status: "PUBLISHED" as any },
          });
          autoPublished = duePending.length;
          console.log(`[Cron Scraper] Auto-published ${autoPublished} pending articles older than 60 mins.`);
          for (const a of duePending) {
            notifyNewPublish(a).catch(() => {});
          }
        }
      } catch (err) {
        console.error("[Cron Scraper] Auto-publish step failed:", err);
      }
    }

    // Fetch fresh stories from RSS feeds — widened to a 6-hour freshness window
    // since scheduled runs are now hours apart (7 fixed times/day) rather than
    // every 30 minutes.
    const newsStories = await scrapeRSSFeeds(5, undefined, 360);
    
    // Also fetch from new specialized categories (mix in with news)
    const scholarshipStories = await scrapeScholarships(1);
    const japaStories = await scrapeJapa(1);
    const moneyStories = await scrapeMakeMoneyOnline(1);
    
    // Combine all sources
    let stories = [...newsStories, ...scholarshipStories, ...japaStories, ...moneyStories];

    // Enrich with images and rank by importance
    stories = await enrichAndRankStories(stories);

    if (stories.length === 0) {
      return NextResponse.json({
        message: "No new stories found in feeds.",
        publishedScheduled,
      });
    }

    const savedStories = [];
    const recentTitles = await getRecentArticleTitles();

    for (const story of stories) {
      if (await storyAlreadyExists(story.sourceUrl, story.title, recentTitles)) {
        console.log(`[Cron Scraper] Skipping duplicate story: ${story.title}`);
        continue;
      }
      // Prevent duplicates within this same batch too.
      recentTitles.push(story.title);

      // Clean competitor links before paraphrasing
      const cleanTitle = cleanAndFormatTitle(story.title);
      const cleanContent = stripCompetitorLinksAndBoilerplate(story.content);

      // Paraphrase with Gemini AI, fall back to local rewriter on error
      let paraphrased: any;
      try {
        paraphrased = await paraphraseNews(cleanContent, cleanTitle, story.category);
      } catch (paraErr) {
        console.log(`[Cron Scraper] Gemini failed for "${cleanTitle}", using local rewriter.`, paraErr);
        paraphrased = localProceduralRewriter(cleanContent, cleanTitle, story.category);
      }
      // story.imageUrl/imageCredit were already fully resolved (source → Wikipedia
      // → stock, with attribution) by enrichAndRankStories above.
      const finalImageUrl = story.imageUrl!;
      const finalImageCredit = story.imageCredit || "Source publisher";

      const slug = paraphrased.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 60);

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      let savedArticleId = "";

      if (isDbConfigured()) {
        const created = await prisma.article.create({
          data: {
            title: paraphrased.title,
            slug: uniqueSlug,
            summary: paraphrased.summary,
            category: paraphrased.category as any,
            status: "AI_PENDING" as any,
            sourceName: "Todaynews AI",
            sourceUrl: story.sourceUrl,
            imageUrl: finalImageUrl,
            imageCredit: finalImageCredit,
            imageAlt: paraphrased.imageAlt || paraphrased.title,
            author: settings.defaultAuthorName,
            pages: {
              create: paraphrased.pages.map((p: { pageNumber: number; title?: string | null; content: string }) => ({
                pageNumber: p.pageNumber,
                title: p.title || null,
                content: p.content,
              })),
            },
          },
        });
        savedArticleId = created.id;
      } else {
        const created = await memoryDb.createArticle({
          title: paraphrased.title,
          slug: uniqueSlug,
          summary: paraphrased.summary,
          category: paraphrased.category as any,
          status: "AI_PENDING" as any,
          sourceName: "Todaynews AI",
          sourceUrl: story.sourceUrl,
          imageUrl: finalImageUrl,
          imageCredit: finalImageCredit,
          imageAlt: paraphrased.imageAlt || paraphrased.title,
          author: settings.defaultAuthorName,
          readTimeMinutes: 3,
          pages: paraphrased.pages,
        });
        savedArticleId = created.id;
      }

      savedStories.push({ id: savedArticleId, title: paraphrased.title });

      // Send email alert to admin with approve button
      await sendNewStoryAlert({
        id: savedArticleId,
        title: paraphrased.title,
        sourceName: "Todaynews AI",
        category: paraphrased.category,
      });
    }

    console.log(`[Cron Scraper] Completed cycle. Saved ${savedStories.length} stories. Auto-published ${autoPublished} pending.`);

    return NextResponse.json({
      success: true,
      count: savedStories.length,
      publishedScheduled,
      autoPublished,
      stories: savedStories,
    });
  } catch (err) {
    console.error("[Cron Scraper Error]:", err);
    return NextResponse.json({ error: "Scrape job failed" }, { status: 500 });
  }
}
