import { NextResponse } from "next/server";
import { isDbConfigured, prisma, memoryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const authHeader = req.headers.get("authorization") || "";
  const cronKey = req.headers.get("x-cron-key") || "";
  return authHeader === `Bearer ${cronSecret}` || cronKey === cronSecret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Auto-Publish Cron] Running auto-publish routine...");
    let publishedScheduled = 0;
    let autoPublishedPending = 0;

    if (isDbConfigured()) {
      // 1. Publish any SCHEDULED articles whose scheduledAt time has passed
      const scheduledResult = await prisma.article.updateMany({
        where: {
          status: "SCHEDULED" as any,
          scheduledAt: { lte: new Date() },
        },
        data: {
          status: "PUBLISHED" as any,
          scheduledAt: null,
        },
      });
      publishedScheduled = scheduledResult.count;

      // 2. Auto-publish AI_PENDING articles that have been untouched for 45+ minutes
      const pendingCutoff = new Date(Date.now() - 45 * 60 * 1000);
      const pendingResult = await prisma.article.updateMany({
        where: {
          status: "AI_PENDING" as any,
          createdAt: { lte: pendingCutoff },
        },
        data: {
          status: "PUBLISHED" as any,
        },
      });
      autoPublishedPending = pendingResult.count;
    } else {
      // Fallback for memory DB
      const allArticles = await memoryDb.getArticles(undefined, undefined, 1, 200);
      const now = Date.now();
      const cutoff = now - 45 * 60 * 1000;

      for (const article of (allArticles.articles || []) as any[]) {
        if (article.status === "SCHEDULED" && article.scheduledAt && new Date(article.scheduledAt).getTime() <= now) {
          await memoryDb.updateArticle(article.id, { status: "PUBLISHED" as any, scheduledAt: null } as any);
          publishedScheduled++;
        } else if ((article.status === "AI_PENDING" || article.status === "PENDING") && new Date(article.createdAt).getTime() <= cutoff) {
          await memoryDb.updateArticle(article.id, { status: "PUBLISHED" as any } as any);
          autoPublishedPending++;
        }
      }
    }

    console.log(`[Auto-Publish Cron] Published ${publishedScheduled} scheduled & ${autoPublishedPending} pending articles.`);

    return NextResponse.json({
      success: true,
      publishedScheduled,
      autoPublishedPending,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Auto-Publish Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to auto-publish" }, { status: 500 });
  }
}
