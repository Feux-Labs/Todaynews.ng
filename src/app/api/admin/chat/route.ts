import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeUrl } from "@/lib/scraper";
import { paraphraseNews } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, action, storyId, storyTitle, storySummary, storyCategory, storySource } = body;

    // Handle direct action buttons from chat cards or inbox
    if (action) {
      if (action === "send_to_inbox") {
        const article = await paraphraseNews(
          storySummary || storyTitle,
          storyTitle,
          storyCategory || "POLITICS"
        );

        const slug = storyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .substring(0, 60);

        if (isDbConfigured()) {
          await prisma.article.create({
            data: {
              title: article.title,
              slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
              summary: article.summary,
              category: article.category as any,
              status: "AI_PENDING" as any,
              sourceName: storySource || "Web Scraper",
              pages: {
                create: article.pages.map((p) => ({
                  pageNumber: p.pageNumber,
                  title: p.title || null,
                  content: p.content,
                })),
              },
            },
          });
        } else {
          await memoryDb.createArticle({
            title: article.title,
            slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
            summary: article.summary,
            category: article.category as any,
            status: "AI_PENDING" as any,
            sourceName: storySource || "Web Scraper",
            author: "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages,
          });
        }

        return NextResponse.json({
          reply: `✅ Sent to Inbox: "${article.title}". You can edit and approve it in the Inbox tab!`,
        });
      }

      if (action === "paraphrase") {
        const article = await paraphraseNews(
          storySummary || storyTitle,
          storyTitle,
          storyCategory || "POLITICS"
        );

        if (storyId) {
          if (!isDbConfigured()) {
            await memoryDb.updateArticlePages(
              storyId,
              article.title,
              article.summary,
              article.category,
              article.pages
            );
          }
        }

        return NextResponse.json({
          reply: `✨ Re-paraphrased successfully:\n\n**New Title**: ${article.title}\n**Summary**: ${article.summary}\n**Page Count**: ${article.pages.length} pages`,
        });
      }

      if (action === "add_to_draft") {
        const article = await paraphraseNews(
          storySummary || storyTitle,
          storyTitle,
          storyCategory || "POLITICS"
        );

        const slug = storyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .substring(0, 60);

        if (isDbConfigured()) {
          await prisma.article.create({
            data: {
              title: article.title,
              slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
              summary: article.summary,
              category: article.category as any,
              status: "DRAFT" as any,
              sourceName: storySource || "Web Scraper",
              pages: {
                create: article.pages.map((p) => ({
                  pageNumber: p.pageNumber,
                  title: p.title || null,
                  content: p.content,
                })),
              },
            },
          });
        } else {
          await memoryDb.createArticle({
            title: article.title,
            slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
            summary: article.summary,
            category: article.category as any,
            status: "DRAFT" as any,
            sourceName: storySource || "Web Scraper",
            author: "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages,
          });
        }

        return NextResponse.json({
          reply: `📝 Saved as Draft: "${article.title}". View it under the Drafts tab.`,
        });
      }
    }

    // Process natural language text commands
    const text = (message || "").toLowerCase();

    // Command: Scrape RSS or URL
    if (text.includes("scrape") || text.includes("fetch") || text.includes("find") || text.includes("search")) {
      // Check if user provided a URL
      const urlMatch = message.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch && urlMatch[0]) {
        const scraped = await scrapeUrl(urlMatch[0]);
        if (scraped) {
          return NextResponse.json({
            reply: `I successfully scraped the article from ${scraped.sourceName}:`,
            stories: [
              {
                id: `scraped-${Date.now()}`,
                title: scraped.title,
                summary: scraped.content.substring(0, 160) + "...",
                sourceName: scraped.sourceName,
                category: scraped.category,
                imageUrl: scraped.imageUrl,
                status: "new",
              },
            ],
          });
        }
      }

      // Fetch RSS feeds matching target topic
      const scrapedStories = await scrapeRSSFeeds(4);
      const cards = scrapedStories.map((s, idx) => ({
        id: `scraped-${Date.now()}-${idx}`,
        title: s.title,
        summary: s.content.substring(0, 150) + "...",
        sourceName: s.sourceName,
        category: s.category,
        imageUrl: s.imageUrl,
        status: "new" as const,
      }));

      return NextResponse.json({
        reply: `Here are ${cards.length} fresh stories I scraped from top Nigerian news sources:`,
        stories: cards,
      });
    }

    // Command: Paraphrase custom text
    if (text.includes("paraphrase") || text.includes("rewrite")) {
      const result = await paraphraseNews(message, "Custom Article", "POLITICS");
      return NextResponse.json({
        reply: `Here is the paraphrased story:\n\n**Title**: ${result.title}\n\n**Summary**: ${result.summary}\n\nSplit into ${result.pages.length} paginated sections.`,
        stories: [
          {
            id: `para-${Date.now()}`,
            title: result.title,
            summary: result.summary,
            sourceName: "AI Paraphraser",
            category: result.category,
            status: "new",
          },
        ],
      });
    }

    // General AI response fallback
    return NextResponse.json({
      reply: `I received your command: "${message}". You can ask me to scrape news feeds, search topics (e.g., "Find Naira news"), or paste a news URL to scrape directly!`,
    });
  } catch (err) {
    console.error("[AI Chat API Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
