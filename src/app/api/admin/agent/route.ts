import { NextResponse } from "next/server";
import { paraphraseNews, localProceduralRewriter, cleanAndFormatTitle } from "@/lib/ai";
import { scrapeRSSFeeds, enrichAndRankStories, resolveStoryImage, stripCompetitorLinksAndBoilerplate } from "@/lib/scraper";
import { isDbConfigured, prisma, memoryDb } from "@/lib/db";
import { getPersistentServerSettings } from "@/lib/settings";
import { notifyNewPublish } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const settings = await getPersistentServerSettings();

    switch (action) {
      // 1. Improve Headline
      case "improve_headline": {
        const { title, category } = payload;
        const cleaned = cleanAndFormatTitle(title || "Breaking News");
        return NextResponse.json({
          success: true,
          originalTitle: title,
          improvedTitle: cleaned,
        });
      }

      // 2. Paraphrase & Save Article to Draft or Publish directly
      case "process_and_save": {
        const { title, content, category, targetStatus = "DRAFT", imageUrl } = payload;
        const cleanTitle = cleanAndFormatTitle(title || "News Update");
        const cleanContent = stripCompetitorLinksAndBoilerplate(content || title);
        const finalCategory = category || "POLITICS";

        let rewritten: any;
        try {
          rewritten = await paraphraseNews(cleanContent, cleanTitle, finalCategory);
        } catch (err) {
          console.warn("[Agent] Gemini failed, falling back to local rewriter:", err);
          rewritten = localProceduralRewriter(cleanContent, cleanTitle, finalCategory);
        }

        const resolvedImage = await resolveStoryImage(imageUrl, rewritten.title, rewritten.category);
        const slug = `${rewritten.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 60)}-${Date.now().toString(36)}`;

        let savedId = "";
        if (isDbConfigured()) {
          const article = await prisma.article.create({
            data: {
              title: rewritten.title,
              slug,
              summary: rewritten.summary,
              category: rewritten.category as any,
              status: targetStatus as any,
              sourceName: "Todaynews AI",
              imageUrl: resolvedImage.url,
              imageCredit: resolvedImage.credit,
              author: settings.defaultAuthorName || "Todaynews.ng Editorial",
              pages: {
                create: rewritten.pages.map((p: { pageNumber: number; title?: string | null; content: string }) => ({
                  pageNumber: p.pageNumber,
                  title: p.title || null,
                  content: p.content,
                })),
              },
            },
          });
          savedId = article.id;
        } else {
          const article = await memoryDb.createArticle({
            title: rewritten.title,
            slug,
            summary: rewritten.summary,
            category: rewritten.category as any,
            status: targetStatus as any,
            sourceName: "Todaynews AI",
            imageUrl: resolvedImage.url,
            imageCredit: resolvedImage.credit,
            author: settings.defaultAuthorName || "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: rewritten.pages,
          });
          savedId = article.id;
        }

        return NextResponse.json({
          success: true,
          articleId: savedId,
          article: rewritten,
          savedStatus: targetStatus,
        });
      }

      // 3. Autonomous Fetch, Rewrite & Instant Publish/Draft
      case "auto_hunt_and_publish": {
        const { limit = 2, autoPublish = false } = payload || {};
        const scraped = await scrapeRSSFeeds(limit, undefined, 60);
        const enriched = await enrichAndRankStories(scraped);

        const results = [];
        for (const story of enriched) {
          const cleanTitle = cleanAndFormatTitle(story.title);
          const cleanContent = stripCompetitorLinksAndBoilerplate(story.content);
          
          let rewritten: any;
          try {
            rewritten = await paraphraseNews(cleanContent, cleanTitle, story.category);
          } catch {
            rewritten = localProceduralRewriter(cleanContent, cleanTitle, story.category);
          }

          const resolvedImage = await resolveStoryImage(story.imageUrl, rewritten.title, rewritten.category, story.imageCredit);
          const slug = `${rewritten.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").substring(0, 60)}-${Date.now().toString(36)}`;
          const status = autoPublish ? "PUBLISHED" : "DRAFT";

          let articleId = "";
          if (isDbConfigured()) {
            const article = await prisma.article.create({
              data: {
                title: rewritten.title,
                slug,
                summary: rewritten.summary,
                category: rewritten.category as any,
                status: status as any,
                sourceName: "Todaynews AI",
                imageUrl: resolvedImage.url,
                imageCredit: resolvedImage.credit,
                author: settings.defaultAuthorName || "Todaynews.ng Editorial",
                pages: {
                  create: rewritten.pages.map((p: { pageNumber: number; title?: string | null; content: string }) => ({
                    pageNumber: p.pageNumber,
                    title: p.title || null,
                    content: p.content,
                  })),
                },
              },
            });
            articleId = article.id;
          } else {
            const article = await memoryDb.createArticle({
              title: rewritten.title,
              slug,
              summary: rewritten.summary,
              category: rewritten.category as any,
              status: status as any,
              sourceName: "Todaynews AI",
              imageUrl: resolvedImage.url,
              imageCredit: resolvedImage.credit,
              author: settings.defaultAuthorName || "Todaynews.ng Editorial",
              readTimeMinutes: 3,
              pages: rewritten.pages,
            });
            articleId = article.id;
          }

          if (status === "PUBLISHED") {
            notifyNewPublish({ id: articleId, title: rewritten.title, slug, summary: rewritten.summary }).catch(() => {});
          }

          results.push({ id: articleId, title: rewritten.title, status });
        }

        return NextResponse.json({
          success: true,
          processedCount: results.length,
          articles: results,
        });
      }

      // 4. Bulk Paraphrase AI_PENDING Inbox Articles
      case "bulk_process_inbox": {
        const { limit = 5, autoPublish = false } = payload || {};
        let pendingArticles: any[] = [];

        if (isDbConfigured()) {
          pendingArticles = await prisma.article.findMany({
            where: { status: "AI_PENDING" as any },
            include: { pages: true },
            take: limit,
          });
        } else {
          const res = await memoryDb.getArticles("AI_PENDING" as any, undefined, 1, limit);
          pendingArticles = res.articles || [];
        }

        const processed = [];
        for (const item of pendingArticles) {
          const combinedContent = item.pages?.map((p: any) => p.content).join("\n\n") || item.summary || item.title;
          const cleanContent = stripCompetitorLinksAndBoilerplate(combinedContent);
          const cleanTitle = cleanAndFormatTitle(item.title);

          let rewritten: any;
          try {
            rewritten = await paraphraseNews(cleanContent, cleanTitle, item.category);
          } catch {
            rewritten = localProceduralRewriter(cleanContent, cleanTitle, item.category);
          }

          const targetStatus = autoPublish ? "PUBLISHED" : "DRAFT";

          if (isDbConfigured()) {
            await prisma.article.update({
              where: { id: item.id },
              data: {
                title: rewritten.title,
                summary: rewritten.summary,
                status: targetStatus as any,
                sourceName: "Todaynews AI",
                pages: {
                  deleteMany: {},
                  create: rewritten.pages.map((p: { pageNumber: number; title?: string | null; content: string }) => ({
                    pageNumber: p.pageNumber,
                    title: p.title || null,
                    content: p.content,
                  })),
                },
              },
            });
          } else {
            await memoryDb.updateArticle(item.id, {
              title: rewritten.title,
              summary: rewritten.summary,
              status: targetStatus as any,
              sourceName: "Todaynews AI",
              pages: rewritten.pages,
            });
          }

          processed.push({ id: item.id, title: rewritten.title, status: targetStatus });
        }

        return NextResponse.json({
          success: true,
          count: processed.length,
          articles: processed,
        });
      }

      // 5. Generate Quick Social Media / WhatsApp Blurb
      case "generate_social_blurb": {
        const { title, summary, slug } = payload;
        const blurb = `🚨 *${title.trim()}*\n\n${summary.trim()}\n\n👉 Read full story on Todaynews.ng:\nhttps://todaynews.ng/news/${slug || ""}\n\n#NigeriaNews #Todaynews #Breaking`;
        return NextResponse.json({ success: true, blurb });
      }

      default:
        return NextResponse.json({ error: `Unknown agent action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[Agent Route Error]:", error);
    return NextResponse.json({ error: error.message || "Agent execution failed" }, { status: 500 });
  }
}
