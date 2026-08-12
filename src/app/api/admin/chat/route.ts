import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeUrl } from "@/lib/scraper";
import { paraphraseNews, chatWithAi } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { getChatMemory, appendChatMessage, clearChatMemory, updateMemoryCardStatus } from "@/lib/aiMemory";
import { getServerSettings } from "@/lib/settings";

export async function GET() {
  try {
    const memory = getChatMemory();
    return NextResponse.json({ history: memory });
  } catch (err) {
    console.error("GET Chat history failed:", err);
    return NextResponse.json({ history: [] });
  }
}

export async function DELETE() {
  try {
    clearChatMemory();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE Chat memory failed:", err);
    return NextResponse.json({ error: "Failed to clear memory" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, action, storyId, storyTitle, storySummary, storyCategory, storySource, storyImageUrl } = body;

    // ── Handle Action Commands (Inbox, Drafts, Paraphrase updates) ────────────
    if (action) {
      if (action === "send_to_inbox" || action === "add_to_draft") {
        const targetStatus = action === "send_to_inbox" ? "AI_PENDING" : "DRAFT";

        // Paraphrase article summary to build rich paginated content
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

        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        let createdId = `art-${Math.random().toString(36).substring(2, 9)}`;

        if (isDbConfigured()) {
          const dbCreated = await prisma.article.create({
            data: {
              title: article.title,
              slug: uniqueSlug,
              summary: article.summary,
              category: article.category as any,
              status: targetStatus as any,
              sourceName: storySource || "Web Scraper",
              imageUrl: storyImageUrl || undefined,
              author: getServerSettings().defaultAuthorName || "Todaynews.ng Editorial",
              pages: {
                create: article.pages.map((p) => ({
                  pageNumber: p.pageNumber,
                  title: p.title || null,
                  content: p.content,
                })),
              },
            },
          });
          createdId = dbCreated.id;
        } else {
          const memCreated = await memoryDb.createArticle({
            title: article.title,
            slug: uniqueSlug,
            summary: article.summary,
            category: article.category as any,
            status: targetStatus as any,
            sourceName: storySource || "Web Scraper",
            imageUrl: storyImageUrl || undefined,
            author: getServerSettings().defaultAuthorName || "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages,
          });
          createdId = memCreated.id;
        }

        // Update card status in memory JSON
        if (storyId) {
          updateMemoryCardStatus(storyId, action === "send_to_inbox" ? "sent_to_inbox" : "in_draft");
        }

        const replyMsg = `✅ **Article Saved to ${
          action === "send_to_inbox" ? "Inbox (Pending Review)" : "Drafts"
        }!**\n\n📌 **Title**: ${article.title}\n📁 **Category**: ${article.category}\n👤 **Author**: ${
          getServerSettings().defaultAuthorName
        }\n📄 **Pages**: ${article.pages.length} section(s) re-written with AI context.`;

        // Append assistant message to chat history
        appendChatMessage({
          role: "assistant",
          content: replyMsg,
        });

        return NextResponse.json({
          success: true,
          articleId: createdId,
          newStatus: action === "send_to_inbox" ? "sent_to_inbox" : "in_draft",
          reply: replyMsg,
        });
      }

      if (action === "paraphrase") {
        const article = await paraphraseNews(
          storySummary || storyTitle,
          storyTitle,
          storyCategory || "POLITICS"
        );

        // If storyId is an existing database article (not temporary scraped ID), update it in DB/memoryDb
        if (storyId && !storyId.startsWith("scraped-")) {
          if (isDbConfigured()) {
            await prisma.article.update({
              where: { id: storyId },
              data: {
                title: article.title,
                summary: article.summary,
                category: article.category as any,
                pages: {
                  deleteMany: {},
                  create: article.pages.map((p) => ({
                    pageNumber: p.pageNumber,
                    title: p.title || null,
                    content: p.content,
                  })),
                },
              },
            });
          } else {
            await memoryDb.updateArticlePages(
              storyId,
              article.title,
              article.summary,
              article.category,
              article.pages
            );
          }
        }

        // Build fully formatted markdown response for the user to copy or review
        const formattedMarkdown = `
# ${article.title}

**Summary / Meta Description**:
${article.summary}

---
${article.pages
  .map(
    (p) => `### Page ${p.pageNumber}: ${p.title || "Continuation"}
${p.content.replace(/<[^>]*>/g, "")}`
  )
  .join("\n\n---\n\n")}
        `.trim();

        const replyMsg = `✨ **Article Paraphrased & Re-written Successfully!**\n\n${formattedMarkdown}`;

        // Create a story card for this paraphrased article so user can send it to Inbox or Drafts directly!
        const paraphrasedCard = {
          id: `para-${Date.now()}`,
          title: article.title,
          summary: article.summary,
          sourceName: storySource || "Todaynews AI",
          category: article.category,
          imageUrl: storyImageUrl,
          status: "new" as const,
        };

        appendChatMessage({
          role: "assistant",
          content: replyMsg,
          storyCards: [paraphrasedCard],
        });

        return NextResponse.json({
          success: true,
          reply: replyMsg,
          stories: [paraphrasedCard],
        });
      }
    }

    // ── Handle Natural Language Conversational Agent ────────────────────────
    if (!message) {
      return NextResponse.json({ reply: "Please type a message to start chatting." });
    }

    const history = getChatMemory();
    const cleanHistory = history.map((h) => ({ role: h.role, content: h.content }));

    // Append user message to history
    appendChatMessage({
      role: "user",
      content: message,
    });

    // Invoke Gemini reasoning engine to determine conversational reply or search intent
    const aiResponse = await chatWithAi(message, cleanHistory);

    let storyCards: any[] = [];

    // If intent is to search, scrape matching stories
    if (aiResponse.intent === "search") {
      const query = aiResponse.searchQuery;
      const scraped = await scrapeRSSFeeds(4, query);

      storyCards = scraped.map((s, idx) => ({
        id: `scraped-${Date.now()}-${idx}`,
        title: s.title,
        summary: s.content.substring(0, 160) + "...",
        sourceName: s.sourceName,
        category: s.category,
        imageUrl: s.imageUrl,
        status: "new" as const,
      }));
    }

    // Append assistant reply to history
    appendChatMessage({
      role: "assistant",
      content: aiResponse.reply,
      storyCards,
    });

    return NextResponse.json({
      reply: aiResponse.reply,
      stories: storyCards,
    });
  } catch (err) {
    console.error("[AI Chat API Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
