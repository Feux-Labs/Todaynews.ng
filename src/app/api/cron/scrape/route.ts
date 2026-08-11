import { NextResponse } from "next/server";
import { scrapeRSSFeeds } from "@/lib/scraper";
import { paraphraseNews } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { sendNewStoryAlert } from "@/lib/mailer";

/**
 * 30-Minute Automated Cron Job Endpoint
 * Triggered by Vercel Cron or manual GET request.
 * Scrapes fresh Nigerian news → Paraphrases with Gemini → Saves to AI_PENDING inbox → Mails Admin.
 */
export async function GET(req: Request) {
  try {
    console.log("[Cron Scraper] Starting 30-minute auto-scrape cycle...");

    // Fetch top 3 fresh stories from RSS feeds published in the last 30 minutes
    const stories = await scrapeRSSFeeds(3, undefined, 30);

    if (stories.length === 0) {
      return NextResponse.json({ message: "No new stories found in feeds." });
    }

    const savedStories = [];

    for (const story of stories) {
      // Paraphrase with Gemini AI
      const paraphrased = await paraphraseNews(story.content, story.title, story.category);

      const slug = paraphrased.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .substring(0, 60);

      const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

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
            imageUrl: story.imageUrl,
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
          imageUrl: story.imageUrl,
          author: "Todaynews.ng AI",
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
      stories: savedStories,
    });
  } catch (err) {
    console.error("[Cron Scraper Error]:", err);
    return NextResponse.json({ error: "Scrape job failed" }, { status: 500 });
  }
}
