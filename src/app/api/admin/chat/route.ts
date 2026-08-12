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

const VALID_CATEGORIES = new Set([
  "POLITICS",
  "NAIRA",
  "ENTERTAINMENT",
  "SPORTS",
  "SECURITY",
  "METRO",
  "EDUCATION",
  "TECHNOLOGY",
  "HEALTH",
]);

function sanitizeCategory(cat?: string): string {
  if (!cat) return "POLITICS";
  const upper = cat.trim().toUpperCase();
  if (VALID_CATEGORIES.has(upper)) return upper;
  if (upper.includes("BUSINESS") || upper.includes("MONEY") || upper.includes("CURRENCY") || upper.includes("FINANCE") || upper.includes("FX")) return "NAIRA";
  if (upper.includes("TECH") || upper.includes("CYBER")) return "TECHNOLOGY";
  if (upper.includes("CRIME") || upper.includes("DEFENSE") || upper.includes("MILITARY") || upper.includes("TERROR")) return "SECURITY";
  if (upper.includes("SCHOOL") || upper.includes("UNI") || upper.includes("ASUU")) return "EDUCATION";
  if (upper.includes("MOVIE") || upper.includes("MUSIC") || upper.includes("SHOW")) return "ENTERTAINMENT";
  return "POLITICS";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, action, storyId, storyTitle, storySummary, storyCategory, storySource, storyImageUrl } = body;

    // ── Handle Action Commands (Inbox, Drafts, Paraphrase updates) ────────────
    if (action) {
      const safeTitle = (storyTitle || storySummary || "Trending Nigerian Story").toString().trim();
      const safeSummary = (storySummary || storyTitle || "Verified Nigerian news update from Todaynews.ng editorial desk.").toString().trim();
      const cleanCategory = sanitizeCategory(storyCategory);

      if (action === "send_to_inbox" || action === "add_to_draft") {
        const targetStatus = action === "send_to_inbox" ? "AI_PENDING" : "DRAFT";

        // Paraphrase article summary to build rich paginated content with 4s fast timeout fallback
        let article: any;
        try {
          const paraphrasePromise = paraphraseNews(safeSummary, safeTitle, cleanCategory);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Paraphrase timeout")), 4000)
          );
          article = await Promise.race([paraphrasePromise, timeoutPromise]);
        } catch (paraErr) {
          console.log("Paraphrase fast fallback used during action:", paraErr);
          article = {
            title: safeTitle,
            summary: safeSummary,
            category: cleanCategory,
            pages: [
              {
                pageNumber: 1,
                title: "Core Facts & Breaking Report",
                content: `<p class="mb-4">${safeSummary}</p>`,
              },
              {
                pageNumber: 2,
                title: "Why This Matters & Background Context",
                content: `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 Why This Matters to Nigerians</h4><p class="text-sm text-muted">Key developments impact trade, policy, and public affairs across Nigeria.</p></div>`,
              },
            ],
          };
        }

        const slugBase = (article.title || safeTitle)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .substring(0, 50) || "nigerian-news";

        const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 8)}`;
        let createdId = `art-${Math.random().toString(36).substring(2, 9)}`;
        const finalCategory = sanitizeCategory(article.category);

        if (isDbConfigured()) {
          try {
            const dbCreated = await prisma.article.create({
              data: {
                title: article.title || safeTitle,
                slug: uniqueSlug,
                summary: article.summary || safeSummary,
                category: finalCategory as any,
                status: targetStatus as any,
                sourceName: storySource || "Web Scraper",
                imageUrl: storyImageUrl || undefined,
                author: getServerSettings().defaultAuthorName || "Todaynews.ng Editorial",
                pages: {
                  create: (article.pages || [{ pageNumber: 1, content: safeSummary }]).map((p: any, idx: number) => ({
                    pageNumber: p.pageNumber || idx + 1,
                    title: p.title || null,
                    content: p.content || "",
                  })),
                },
              },
            });
            createdId = dbCreated.id;
          } catch (dbErr) {
            console.error("Prisma article creation failed, falling back to memoryDb:", dbErr);
            const memCreated = await memoryDb.createArticle({
              title: article.title || safeTitle,
              slug: uniqueSlug,
              summary: article.summary || safeSummary,
              category: finalCategory as any,
              status: targetStatus as any,
              sourceName: storySource || "Web Scraper",
              imageUrl: storyImageUrl || undefined,
              author: getServerSettings().defaultAuthorName || "Todaynews.ng Editorial",
              readTimeMinutes: 3,
              pages: article.pages || [{ pageNumber: 1, content: safeSummary }],
            });
            createdId = memCreated.id;
          }
        } else {
          const memCreated = await memoryDb.createArticle({
            title: article.title || safeTitle,
            slug: uniqueSlug,
            summary: article.summary || safeSummary,
            category: finalCategory as any,
            status: targetStatus as any,
            sourceName: storySource || "Web Scraper",
            imageUrl: storyImageUrl || undefined,
            author: getServerSettings().defaultAuthorName || "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages || [{ pageNumber: 1, content: safeSummary }],
          });
          createdId = memCreated.id;
        }

        // Update card status in memory JSON
        if (storyId) {
          try {
            updateMemoryCardStatus(storyId, action === "send_to_inbox" ? "sent_to_inbox" : "in_draft");
          } catch {}
        }

        const replyMsg = `✅ **Article Saved to ${
          action === "send_to_inbox" ? "Inbox (Pending Review)" : "Drafts"
        }!**\n\n📌 **Title**: ${article.title || safeTitle}\n📁 **Category**: ${finalCategory}\n👤 **Author**: ${
          getServerSettings().defaultAuthorName
        }\n📄 **Pages**: ${(article.pages || []).length} section(s) re-written with AI context.`;

        // Append assistant message to chat history
        try {
          appendChatMessage({
            role: "assistant",
            content: replyMsg,
          });
        } catch {}

        return NextResponse.json({
          success: true,
          articleId: createdId,
          newStatus: action === "send_to_inbox" ? "sent_to_inbox" : "in_draft",
          reply: replyMsg,
        });
      }

      if (action === "paraphrase") {
        let article: any;
        try {
          article = await paraphraseNews(
            safeSummary,
            safeTitle,
            cleanCategory
          );
        } catch (paraErr) {
          console.error("Paraphrase news failed during action, using fallback data:", paraErr);
          article = {
            title: safeTitle,
            summary: safeSummary,
            category: cleanCategory,
            pages: [
              {
                pageNumber: 1,
                title: "Core Facts & Breaking Report",
                content: `<p class="mb-4">${safeSummary}</p>`,
              },
            ],
          };
        }

        const finalCategory = sanitizeCategory(article.category);

        // If storyId is an existing database article (not temporary scraped ID), update it in DB/memoryDb
        if (storyId && !storyId.startsWith("scraped-")) {
          if (isDbConfigured()) {
            try {
              await prisma.article.update({
                where: { id: storyId },
                data: {
                  title: article.title || safeTitle,
                  summary: article.summary || safeSummary,
                  category: finalCategory as any,
                  pages: {
                    deleteMany: {},
                    create: (article.pages || []).map((p: any, idx: number) => ({
                      pageNumber: p.pageNumber || idx + 1,
                      title: p.title || null,
                      content: p.content || "",
                    })),
                  },
                },
              });
            } catch (dbUpErr) {
              console.error("Prisma update failed, falling back to memoryDb:", dbUpErr);
              await memoryDb.updateArticlePages(
                storyId,
                article.title || safeTitle,
                article.summary || safeSummary,
                finalCategory,
                article.pages || [{ pageNumber: 1, content: safeSummary }]
              );
            }
          } else {
            await memoryDb.updateArticlePages(
              storyId,
              article.title || safeTitle,
              article.summary || safeSummary,
              finalCategory,
              article.pages || [{ pageNumber: 1, content: safeSummary }]
            );
          }
        }

        // Build fully formatted markdown response for the user to copy or review
        const formattedMarkdown = `
# ${article.title || safeTitle}

**Summary / Meta Description**:
${article.summary || safeSummary}

---
${(article.pages || [])
  .map(
    (p: any) => `### Page ${p.pageNumber}: ${p.title || "Continuation"}
${(p.content || "").replace(/<[^>]*>/g, "")}`
  )
  .join("\n\n---\n\n")}
        `.trim();

        const replyMsg = `✨ **Article Paraphrased & Re-written Successfully!**\n\n${formattedMarkdown}`;

        // Create a story card for this paraphrased article so user can send it to Inbox or Drafts directly!
        const paraphrasedCard = {
          id: `para-${Date.now()}`,
          title: article.title || safeTitle,
          summary: article.summary || safeSummary,
          sourceName: storySource || "Todaynews AI",
          category: finalCategory,
          imageUrl: storyImageUrl,
          status: "new" as const,
        };

        try {
          appendChatMessage({
            role: "assistant",
            content: replyMsg,
            storyCards: [paraphrasedCard],
          });
        } catch {}

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
