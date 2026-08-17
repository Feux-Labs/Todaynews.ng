import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function syncDbPageViewsWithArticleViews() {
  try {
    const articles = await prisma.article.findMany({
      where: { views: { gt: 0 } },
      select: { slug: true, category: true, views: true, createdAt: true },
    });

    for (const art of articles) {
      const pvCount = await (prisma as any).pageView.count({
        where: { articleSlug: art.slug },
      });

      if (pvCount < art.views) {
        const missing = art.views - pvCount;
        const now = Date.now();
        const start = new Date(art.createdAt).getTime();
        const timeSpan = Math.max(now - start, 3600000);

        const records = [];
        for (let i = 0; i < missing; i++) {
          const randomTime = new Date(start + Math.random() * timeSpan);
          records.push({
            articleSlug: art.slug,
            category: art.category || "GENERAL",
            visitedAt: randomTime,
          });
        }

        for (let i = 0; i < records.length; i += 100) {
          await (prisma as any).pageView.createMany({
            data: records.slice(i, i + 100),
          });
        }
      }
    }
  } catch (err) {
    console.error("[PageView Sync] Error syncing pageviews:", err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const period = (searchParams.get("period") || "today") as "today" | "week" | "month";

    if (type === "counts") {
      if (isDbConfigured()) {
        try {
          const [total, published, drafts, pending] = await Promise.all([
            prisma.article.count(),
            prisma.article.count({ where: { status: "PUBLISHED" as any } }),
            prisma.article.count({ where: { status: "DRAFT" as any } }),
            prisma.article.count({ where: { status: { in: ["AI_PENDING" as any, "PENDING" as any] } } }),
          ]);
          return NextResponse.json({ total, published, drafts, pending });
        } catch (err) {
          console.error("[Analytics Counts] DB query failed; using memory fallback.", err);
        }
      }

      const counts = await memoryDb.getArticleCount();
      return NextResponse.json(counts);
    }

    const now = new Date();
    let cutoff: Date;
    if (period === "today") {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (isDbConfigured()) {
      try {
        await syncDbPageViewsWithArticleViews();

        const totalViews = await (prisma as any).pageView.count({
          where: { visitedAt: { gte: cutoff } },
        });

        const totalArticles = await prisma.article.count({
          where: { status: "PUBLISHED" as any },
        });

        const topSlugs = await (prisma as any).pageView.groupBy({
          by: ["articleSlug"],
          where: { visitedAt: { gte: cutoff } },
          _count: { articleSlug: true },
          orderBy: { _count: { articleSlug: "desc" } },
          take: 10,
        });

        let topArticles: { slug: string; views: number }[] = [];
        if (topSlugs.length > 0) {
          topArticles = topSlugs.map((item: any) => ({
            slug: item.articleSlug,
            views: item._count.articleSlug,
          }));
        } else {
          const articles = await prisma.article.findMany({
            take: 10,
            orderBy: { views: "desc" },
            select: { slug: true, views: true },
          });
          topArticles = articles.map((a) => ({ slug: a.slug, views: a.views }));
        }

        const catGroups = await prisma.article.groupBy({
          by: ["category"],
          where: { status: "PUBLISHED" as any },
          _count: { category: true },
        });

        const categoryBreakdown = catGroups.map((g) => ({
          category: g.category,
          count: g._count.category,
        }));

        const hourlyViews: { hour: string; views: number }[] = [];
        for (let i = 23; i >= 0; i--) {
          const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
          hourStart.setMinutes(0, 0, 0);
          const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

          const count = await (prisma as any).pageView.count({
            where: {
              visitedAt: { gte: hourStart, lt: hourEnd },
            },
          });

          hourlyViews.push({
            hour: hourStart.toLocaleTimeString("en-NG", { hour: "2-digit", hour12: true }),
            views: count,
          });
        }

        return NextResponse.json({
          totalViews,
          totalArticles,
          topArticles,
          categoryBreakdown,
          hourlyViews,
        });
      } catch (err) {
        console.error("[Analytics Stats] DB query failed; using memory fallback.", err);
      }
    }

    const stats = await memoryDb.getViewStats(period);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[Analytics Stats Error]:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
