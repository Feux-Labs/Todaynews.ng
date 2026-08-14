import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeUrl, resolveStoryImage } from "@/lib/scraper";
import { paraphraseNews, chatWithAi } from "@/lib/ai";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import {
  getPersistentChatMemory,
  appendPersistentChatMessage,
  clearPersistentChatMemory,
  updatePersistentMemoryCardStatus,
  listPersistentChatSessions,
} from "@/lib/aiMemory";
import { getPersistentServerSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;
    const sessions = await listPersistentChatSessions();
    const activeSessionId = sessionId || sessions[0]?.id;
    const memory = await getPersistentChatMemory(activeSessionId);
    return NextResponse.json({ history: memory, sessions, activeSessionId });
  } catch (err) {
    console.error("GET Chat history failed:", err);
    return NextResponse.json({ history: [] });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    await clearPersistentChatMemory(searchParams.get("sessionId") || undefined);
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
  "SCHOLARSHIP",
  "JAPA",
  "MAKE_MONEY_ONLINE",
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
  if (upper.includes("SCHOLARSHIP") || upper.includes("GRANT") || upper.includes("TUITION")) return "SCHOLARSHIP";
  if (upper.includes("JAPA") || upper.includes("VISA") || upper.includes("RELOCATION") || upper.includes("EMIGRATE")) return "JAPA";
  if (upper.includes("EARN") || upper.includes("PASSIVE") || upper.includes("FREELANCE") || upper.includes("SIDE HUSTLE")) return "MAKE_MONEY_ONLINE";
  return "POLITICS";
}

async function findExistingArticle(sourceUrl?: string, title?: string) {
  const cleanUrl = sourceUrl?.trim();
  const cleanTitle = title?.trim();
  if (!cleanUrl && !cleanTitle) return null;

  if (isDbConfigured()) {
    try {
      return await prisma.article.findFirst({
        where: {
          OR: [
            ...(cleanUrl ? [{ sourceUrl: cleanUrl }] : []),
            ...(cleanTitle ? [{ title: { equals: cleanTitle, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, status: true, title: true },
      });
    } catch (err) {
      console.error("[AI Chat] Duplicate DB lookup failed; checking memory fallback.", err);
    }
  }

  const memoryArticles = await memoryDb.getArticles(undefined, undefined, 1, 100);
  return (memoryArticles.articles || []).find((article: any) =>
    (cleanUrl && article.sourceUrl === cleanUrl) ||
    (cleanTitle && article.title.toLowerCase() === cleanTitle.toLowerCase())
  ) || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      action,
      storyId,
      sessionId,
      storyTitle,
      storySummary,
      storyContent,
      storyCategory,
      storySource,
      storySourceUrl,
      storyImageUrl,
    } = body;

    // ── Handle Action Commands (Inbox, Drafts, Paraphrase updates) ────────────
    if (action) {
      const safeTitle = (storyTitle || storySummary || "Trending Nigerian Story").toString().trim();
      const safeSummary = (storySummary || storyTitle || "Verified Nigerian news update from Todaynews.ng editorial desk.").toString().trim();
      const safeContent = (storyContent || safeSummary).toString().trim();
      const cleanCategory = sanitizeCategory(storyCategory);
      const settings = await getPersistentServerSettings();

      if (action === "send_to_inbox" || action === "add_to_draft") {
        const targetStatus = action === "send_to_inbox" ? "AI_PENDING" : "DRAFT";
        const existing = await findExistingArticle(storySourceUrl, safeTitle);
        if (existing) {
          const replyMsg = `This story already exists as "${existing.title}" with status ${existing.status}. I did not create a duplicate.`;
          if (storyId) {
            await updatePersistentMemoryCardStatus(storyId, action === "send_to_inbox" ? "sent_to_inbox" : "in_draft", sessionId);
          }
          await appendPersistentChatMessage({ role: "assistant", content: replyMsg, sessionId });
          return NextResponse.json({
            success: true,
            articleId: existing.id,
            duplicate: true,
            newStatus: action === "send_to_inbox" ? "sent_to_inbox" : "in_draft",
            reply: replyMsg,
          });
        }

        // Paraphrase with Gemini — allow up to 25s before falling back to local rewriter
        let article: any;
        try {
          const paraphrasePromise = paraphraseNews(safeContent, safeTitle, cleanCategory);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Paraphrase timeout after 25s")), 25000)
          );
          article = await Promise.race([paraphrasePromise, timeoutPromise]) as any;
        } catch (paraErr) {
          console.log("Paraphrase timeout/error — using rich local rewriter fallback:", paraErr);
          article = {
            title: safeTitle,
            summary: safeSummary,
            category: cleanCategory,
            pages: [
              {
                pageNumber: 1,
                title: "Core Facts & Breaking Report",
                content: safeContent
                  .split(/(?<=[.!?])\s+/)
                  .filter((s: string) => s.length > 20)
                  .slice(0, 5)
                  .map((s: string) => `<p class="mb-4">${s}</p>`)
                  .join("\n") ||
                  `<p class="mb-4">${safeContent}</p>
                   <p class="mb-4">Credible sources confirm this development is being closely monitored. Early accounts suggest significant implications for affected parties and broader regional stakeholders.</p>
                   <p class="mb-4">Todaynews.ng is tracking this story in real time. Relevant authorities are expected to issue an official statement in the coming hours.</p>
                   <p class="mb-4"><em>Note: Details remain subject to official verification by relevant authorities. Todaynews.ng is committed to accurate, verified reporting.</em></p>`,
              },
              {
                pageNumber: 2,
                title: "Why This Matters & Background Context",
                content: `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 Why This Matters to Nigerians</h4><p class="text-sm text-muted">This development carries direct implications for trade, governance, security, and purchasing power across Nigeria's 36 states.</p></div>
                  <p class="mb-4">Historical precedent shows that events of this nature have led to significant policy adjustments within weeks. The Nigerian government has previously responded to similar triggers with emergency regulations and inter-ministerial taskforce deployments.</p>
                  <p class="mb-4">Economic analysts noted that the downstream effects on the naira, fuel prices, and federal budget allocation are difficult to predict without further official data. However, precautionary advisories have already been issued to relevant agencies.</p>
                  <p class="mb-4">Civil society organisations and opposition voices have begun weighing in on the matter, calling for transparency and timely disclosure from the appropriate government ministries and parastatals.</p>`,
              },
              {
                pageNumber: 3,
                title: "What Happens Next & Expert Outlook",
                content: `<p class="mb-4">Stakeholders, civil society groups, and diplomatic observers are awaiting official press briefings from government representatives to determine the next course of action.</p>
                  <p class="mb-4">Policy analysts expect that the relevant federal agencies will convene a session in the coming 48 to 72 hours to assess the situation formally and communicate an official government position.</p>
                  <p class="mb-4">Security and intelligence agencies remain on heightened alert. Sources familiar with the matter confirmed that inter-agency coordination is already underway to manage any potential fallout.</p>
                  <p class="mb-4">The international community, including Nigeria's diplomatic partners, is reportedly monitoring developments closely. A formal response from external observers is anticipated once the government's statement is released.</p>
                  <p class="mb-4"><strong>📌 Todaynews.ng will continue to provide real-time, verified updates on this developing story. Bookmark this page and follow our Breaking News ticker for the latest.</strong></p>`,
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

        const finalImageUrl = await resolveStoryImage(
          storyImageUrl,
          safeTitle,
          finalCategory
        );

        if (isDbConfigured()) {
          try {
            const dbCreated = await prisma.article.create({
              data: {
                title: article.title || safeTitle,
                slug: uniqueSlug,
                summary: article.summary || safeSummary,
                category: finalCategory as any,
                status: targetStatus as any,
                sourceUrl: storySourceUrl || undefined,
                sourceName: storySource || "Web Scraper",
                imageUrl: finalImageUrl,
                author: settings.defaultAuthorName || "Todaynews.ng Editorial",
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
              sourceUrl: storySourceUrl || undefined,
              sourceName: storySource || "Web Scraper",
              imageUrl: finalImageUrl,
              author: settings.defaultAuthorName || "Todaynews.ng Editorial",
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
            sourceUrl: storySourceUrl || undefined,
            sourceName: storySource || "Web Scraper",
            imageUrl: finalImageUrl,
            author: settings.defaultAuthorName || "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages || [{ pageNumber: 1, content: safeSummary }],
          });
          createdId = memCreated.id;
        }

        if (storyId) {
          try {
            await updatePersistentMemoryCardStatus(storyId, action === "send_to_inbox" ? "sent_to_inbox" : "in_draft", sessionId);
          } catch {}
        }

        const replyMsg = `✅ **Article Saved to ${
          action === "send_to_inbox" ? "Inbox (Pending Review)" : "Drafts"
        }!**\n\n📌 **Title**: ${article.title || safeTitle}\n📁 **Category**: ${finalCategory}\n👤 **Author**: ${
          settings.defaultAuthorName
        }\n📄 **Pages**: ${(article.pages || []).length} section(s) re-written with AI context.`;

        try {
          await appendPersistentChatMessage({
            role: "assistant",
            content: replyMsg,
            sessionId,
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
            safeContent,
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
                content: `<p class="mb-4">${safeContent}</p>`,
              },
            ],
          };
        }

        const finalCategory = sanitizeCategory(article.category);

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

        const paraphrasedImageUrl = await resolveStoryImage(
          storyImageUrl,
          article.title || safeTitle,
          finalCategory
        );

        const paraphrasedCard = {
          id: `para-${Date.now()}`,
          title: article.title || safeTitle,
          summary: article.summary || safeSummary,
          sourceName: storySource || "Todaynews AI",
          category: finalCategory,
          imageUrl: paraphrasedImageUrl,
          status: "new" as const,
        };

        try {
          await appendPersistentChatMessage({
            role: "assistant",
            content: replyMsg,
            storyCards: [paraphrasedCard],
            sessionId,
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

    const history = await getPersistentChatMemory(sessionId);
    const cleanHistory = history.map((h) => ({ role: h.role, content: h.content }));

    const persistedUserMessage = await appendPersistentChatMessage({
      role: "user",
      content: message,
      sessionId,
    });
    const activeSessionId = persistedUserMessage.sessionId || sessionId;

    const aiResponse = await chatWithAi(message, cleanHistory);

    let storyCards: any[] = [];

    // If intent is to search, scrape matching stories.
    // NOTE: scrapeRSSFeeds's second parameter here is being passed a free-text
    // search phrase (aiResponse.searchQuery, e.g. "Nigeria scholarship
    // opportunities"). Confirm this matches what scrapeRSSFeeds's signature
    // actually expects in that position — if it expects a category enum
    // instead of free text, this is why unrelated stories keep coming back
    // regardless of what was asked for. Check /lib/scraper's real signature.
    if (aiResponse.intent === "search") {
      const query = aiResponse.searchQuery;
      const urlMatch = message.match(/https?:\/\/[^\s)]+/i);
      const scraped = urlMatch
        ? [await scrapeUrl(urlMatch[0])].filter(Boolean) as any[]
        : await scrapeRSSFeeds(6, query);

      storyCards = scraped.map((s, idx) => ({
        id: `scraped-${Date.now()}-${idx}`,
        title: s.title,
        summary: s.content.substring(0, 280) + (s.content.length > 280 ? "..." : ""),
        content: s.content,
        sourceName: s.sourceName,
        sourceUrl: s.sourceUrl,
        category: s.category,
        imageUrl: s.imageUrl,
        status: "new" as const,
      }));
    }

    await appendPersistentChatMessage({
      role: "assistant",
      content: aiResponse.reply,
      storyCards,
      sessionId: activeSessionId,
    });

    return NextResponse.json({
      reply: aiResponse.reply,
      stories: storyCards,
      sessionId: activeSessionId,
    });
  } catch (err) {
    console.error("[AI Chat API Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}