import { NextResponse } from "next/server";
import { scrapeRSSFeeds, scrapeUrl, resolveStoryImage, stripCompetitorLinksAndBoilerplate, getRecentArticleTitles, titleSimilarity, searchGoogleNews } from "@/lib/scraper";
import { paraphraseNews, chatWithAi, cleanAndFormatTitle, localProceduralRewriter } from "@/lib/ai";
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
      const exact = await prisma.article.findFirst({
        where: {
          OR: [
            ...(cleanUrl ? [{ sourceUrl: cleanUrl }] : []),
            ...(cleanTitle ? [{ title: { equals: cleanTitle, mode: "insensitive" as const } }] : []),
          ],
        },
        select: { id: true, status: true, title: true },
      });
      if (exact) return exact;

      // Fuzzy check — catches a reworded version of a story already saved.
      if (cleanTitle) {
        const recentTitles = await getRecentArticleTitles();
        const fuzzyMatch = recentTitles.find((t) => titleSimilarity(cleanTitle, t) >= 0.6);
        if (fuzzyMatch) {
          return prisma.article.findFirst({
            where: { title: fuzzyMatch },
            select: { id: true, status: true, title: true },
          });
        }
      }
      return null;
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
      storyImageCredit,
    } = body;

    // ── Handle Action Commands (Inbox, Drafts, Paraphrase updates) ────────────
    if (action) {
      const safeTitle = (storyTitle || storySummary || "Trending Nigerian Story").toString().trim();
      const safeSummary = (storySummary || storyTitle || "Verified Nigerian news update from Todaynews.ng editorial desk.").toString().trim();
      const safeContent = (storyContent || safeSummary).toString().trim();
      const cleanCategory = sanitizeCategory(storyCategory);
      const settings = await getPersistentServerSettings();

      if (action === "send_to_inbox" || action === "add_to_draft" || action === "publish") {
        const targetStatus = action === "send_to_inbox" ? "AI_PENDING" : action === "add_to_draft" ? "DRAFT" : "PUBLISHED";
        const cardStatusLabel = action === "send_to_inbox" ? "sent_to_inbox" : action === "add_to_draft" ? "in_draft" : "published";
        const existing = await findExistingArticle(storySourceUrl, safeTitle);
        if (existing) {
          const replyMsg = `This story already exists as "${existing.title}" with status ${existing.status}. I did not create a duplicate.`;
          if (storyId) {
            await updatePersistentMemoryCardStatus(storyId, cardStatusLabel, sessionId);
          }
          await appendPersistentChatMessage({ role: "assistant", content: replyMsg, sessionId });
          return NextResponse.json({
            success: true,
            articleId: existing.id,
            duplicate: true,
            newStatus: cardStatusLabel,
            reply: replyMsg,
          });
        }

        const cleanedTitle = cleanAndFormatTitle(safeTitle);
        const cleanedContent = stripCompetitorLinksAndBoilerplate(safeContent || safeSummary);

        // Paraphrase with Gemini — allow up to 25s before falling back to local rewriter
        let article: any;
        try {
          const paraphrasePromise = paraphraseNews(cleanedContent, cleanedTitle, cleanCategory);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Paraphrase timeout after 25s")), 25000)
          );
          article = await Promise.race([paraphrasePromise, timeoutPromise]) as any;
        } catch (paraErr) {
          console.log("Paraphrase timeout/error — using rich local rewriter fallback:", paraErr);
          article = localProceduralRewriter(cleanedContent, cleanedTitle, cleanCategory);
        }

        const slugBase = (article.title || cleanedTitle)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .substring(0, 50) || "nigerian-news";

        const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 8)}`;
        let createdId = `art-${Math.random().toString(36).substring(2, 9)}`;
        const finalCategory = sanitizeCategory(article.category);

        const resolvedImage = await resolveStoryImage(
          storyImageUrl,
          safeTitle,
          finalCategory,
          storyImageCredit
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
                sourceName: "Todaynews AI",
                imageUrl: resolvedImage.url,
                imageCredit: resolvedImage.credit,
                imageAlt: article.imageAlt || article.title || safeTitle,
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
              sourceName: "Todaynews AI",
              imageUrl: resolvedImage.url,
              imageCredit: resolvedImage.credit,
              imageAlt: article.imageAlt || article.title || safeTitle,
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
            sourceName: "Todaynews AI",
            imageUrl: resolvedImage.url,
            imageCredit: resolvedImage.credit,
            imageAlt: article.imageAlt || article.title || safeTitle,
            author: settings.defaultAuthorName || "Todaynews.ng Editorial",
            readTimeMinutes: 3,
            pages: article.pages || [{ pageNumber: 1, content: safeSummary }],
          });
          createdId = memCreated.id;
        }

        if (storyId) {
          try {
            await updatePersistentMemoryCardStatus(storyId, cardStatusLabel, sessionId);
          } catch {}
        }

        if (targetStatus === "PUBLISHED") {
          try {
            const { notifyNewPublish } = await import("@/lib/push");
            await notifyNewPublish({ id: createdId, title: article.title || safeTitle, slug: uniqueSlug, summary: article.summary || safeSummary });
          } catch (err) {
            console.error("[AI Chat] Push notify on publish failed (non-fatal):", err);
          }
        }

        const destinationLabel =
          action === "send_to_inbox" ? "Inbox (Pending Review)" : action === "add_to_draft" ? "Drafts" : "Live — Published on Todaynews.ng";

        const replyMsg = `✅ **Article Saved to ${destinationLabel}!**\n\n📌 **Title**: ${article.title || safeTitle}\n📁 **Category**: ${finalCategory}\n👤 **Author**: ${
          settings.defaultAuthorName
        }\n📄 **Pages**: ${(article.pages || []).length} section(s) re-written with AI context.${
          targetStatus === "PUBLISHED" ? `\n🔗 **Live at**: /article/${uniqueSlug}` : ""
        }`;

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
        const cleanedTitle = cleanAndFormatTitle(safeTitle);
        const cleanedContent = stripCompetitorLinksAndBoilerplate(safeContent || safeSummary);

        let article: any;
        try {
          article = await paraphraseNews(
            cleanedContent,
            cleanedTitle,
            cleanCategory
          );
        } catch (paraErr) {
          console.error("Paraphrase news failed during action, using fallback data:", paraErr);
          article = localProceduralRewriter(cleanedContent, cleanedTitle, cleanCategory);
        }

        const finalCategory = sanitizeCategory(article.category);

        // Resolve/backfill a real image before persisting — an existing
        // article being re-paraphrased should never lose (or keep missing)
        // its image just because this action forgot to touch that column.
        const paraphraseResolvedImage = await resolveStoryImage(
          storyImageUrl,
          article.title || safeTitle,
          finalCategory,
          storyImageCredit
        );

        if (storyId && !storyId.startsWith("scraped-")) {
          if (isDbConfigured()) {
            try {
              await prisma.article.update({
                where: { id: storyId },
                data: {
                  title: article.title || safeTitle,
                  summary: article.summary || safeSummary,
                  category: finalCategory as any,
                  imageUrl: paraphraseResolvedImage.url,
                  imageCredit: paraphraseResolvedImage.credit,
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

        const paraphrasedCard = {
          id: `para-${Date.now()}`,
          title: article.title || safeTitle,
          summary: article.summary || safeSummary,
          sourceName: "Todaynews AI",
          category: finalCategory,
          imageUrl: paraphraseResolvedImage.url,
          imageCredit: paraphraseResolvedImage.credit,
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

    // If intent is to search, scrape matching stories from both the fixed
    // RSS source list and a free-text whole-web search (see below).
    if (aiResponse.intent === "search") {
      const query = aiResponse.searchQuery;
      const urlMatch = message.match(/https?:\/\/[^\s)]+/i);

      let scraped: any[];
      if (urlMatch) {
        scraped = [await scrapeUrl(urlMatch[0])].filter(Boolean) as any[];
      } else if (query) {
        // Blend the fixed source list with a free, keyless whole-web search
        // (Google News RSS) so results aren't limited to RSS_SOURCES.
        const [fromFeeds, fromWebInitial] = await Promise.all([
          scrapeRSSFeeds(6, query),
          searchGoogleNews(query),
        ]);
        // Google News' own matching can come back empty for an over-specific
        // query — retry once with just the leading significant words before
        // giving up, rather than silently returning fewer/no results.
        let fromWeb = fromWebInitial;
        if (fromWeb.length === 0) {
          const broadQuery = query.split(/\s+/).slice(0, 4).join(" ");
          if (broadQuery && broadQuery !== query) {
            fromWeb = await searchGoogleNews(broadQuery);
          }
        }
        const combined = [...fromFeeds];
        for (const story of fromWeb) {
          if (!combined.some((s) => titleSimilarity(s.title, story.title) >= 0.6)) {
            combined.push(story);
          }
        }
        scraped = combined.slice(0, 8);
      } else {
        scraped = await scrapeRSSFeeds(6);
      }

      // Resolve accurate, correctly-credited images up front so the preview
      // cards never show a mismatched/unrelated thumbnail.
      const resolvedImages = await Promise.all(
        scraped.map((s) => resolveStoryImage(s.imageUrl, s.title, s.category, s.imageCredit))
      );

      storyCards = scraped.map((s, idx) => ({
        id: `scraped-${Date.now()}-${idx}`,
        title: s.title,
        summary: s.content.substring(0, 280) + (s.content.length > 280 ? "..." : ""),
        content: s.content,
        sourceName: s.sourceName,
        sourceUrl: s.sourceUrl,
        category: s.category,
        imageUrl: resolvedImages[idx].url,
        imageCredit: resolvedImages[idx].credit,
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