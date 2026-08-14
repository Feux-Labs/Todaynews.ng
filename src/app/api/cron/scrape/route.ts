import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeScholarships, scrapeJapa, scrapeMakeMoneyOnline, enrichAndRankStories, resolveStoryImage } from "@/lib/scraper";
import { paraphraseNews } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { sendNewStoryAlert } from "@/lib/mailer";
import { getPersistentServerSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function storyAlreadyExists(sourceUrl: string, title: string) {
  if (isDbConfigured()) {
    try {
      const existing = await prisma.article.findFirst({
        where: {
          OR: [
            { sourceUrl },
            { title: { equals: title, mode: "insensitive" as const } },
          ],
        },
        select: { id: true },
      });
      if (existing) return true;
    } catch (err) {
      console.error("[Cron Scraper] Duplicate DB check failed; using memory fallback.", err);
    }
  }

  const memoryArticles = await memoryDb.getArticles(undefined, undefined, 1, 100);
  return (memoryArticles.articles || []).some((article: any) =>
    article.sourceUrl === sourceUrl ||
    article.title.toLowerCase() === title.toLowerCase()
  );
}

/**
 * 30-Minute Automated Cron Job Endpoint
 * Triggered by Vercel Cron or manual GET request.
 * Scrapes fresh Nigerian news → Paraphrases with Gemini → Saves to AI_PENDING inbox → Mails Admin.
 */
export async function GET(req: Request) {
  try {
    console.log("[Cron Scraper] Starting 30-minute auto-scrape cycle...");
    const settings = await getPersistentServerSettings();
    let publishedScheduled = 0;

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

    // Fetch top 3 fresh stories from RSS feeds published in the last 30 minutes
    const newsStories = await scrapeRSSFeeds(3, undefined, 30);
    
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

    for (const story of stories) {
      if (await storyAlreadyExists(story.sourceUrl, story.title)) {
        console.log(`[Cron Scraper] Skipping duplicate story: ${story.title}`);
        continue;
      }

      // Paraphrase with Gemini AI
      const paraphrased = await paraphraseNews(story.content, story.title, story.category);
      const finalImageUrl = await resolveStoryImage(story.imageUrl, paraphrased.title, paraphrased.category);

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
            sourceName: story.sourceName,
            sourceUrl: story.sourceUrl,
            imageUrl: finalImageUrl,
            author: settings.defaultAuthorName,
            pages: {
              create: paraphrased.pages.map((p) => ({
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
          sourceName: story.sourceName,
          sourceUrl: story.sourceUrl,
          imageUrl: finalImageUrl,
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
        sourceName: story.sourceName,
        category: paraphrased.category,
      });
    }

    console.log(`[Cron Scraper] Completed cycle. Saved & notified ${savedStories.length} stories.`);

    return NextResponse.json({
      success: true,
      count: savedStories.length,
      publishedScheduled,
      stories: savedStories,
    });
  } catch (err) {
    console.error("[Cron Scraper Error]:", err);
    return NextResponse.json({ error: "Scrape job failed" }, { status: 500 });
  }
}
