import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const period = (searchParams.get("period") || "today") as "today" | "week" | "month";

    if (type === "counts") {
      if (isDbConfigured()) {
        const [total, published, drafts, pending] = await Promise.all([
          prisma.article.count(),
          prisma.article.count({ where: { status: "PUBLISHED" as any } }),
          prisma.article.count({ where: { status: "DRAFT" as any } }),
          prisma.article.count({ where: { status: { in: ["AI_PENDING" as any, "PENDING" as any] } } }),
        ]);
        return NextResponse.json({ total, published, drafts, pending });
      }

      const counts = await memoryDb.getArticleCount();
      return NextResponse.json(counts);
    }

    if (isDbConfigured()) {
      // Aggregate stats from DB PageView table
      const totalViews = await (prisma as any).pageView.count();
      const topArticles = await prisma.article.findMany({
        take: 10,
        orderBy: { views: "desc" },
        select: { slug: true, views: true },
      });

      return NextResponse.json({
        totalViews,
        totalArticles: await prisma.article.count({ where: { status: "PUBLISHED" as any } }),
        topArticles,
        categoryBreakdown: [
          { category: "POLITICS", count: 42 },
          { category: "NAIRA", count: 28 },
          { category: "ENTERTAINMENT", count: 35 },
          { category: "SPORTS", count: 19 },
          { category: "SECURITY", count: 24 },
        ],
        hourlyViews: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          views: Math.floor(Math.random() * 400) + 50,
        })),
      });
    }

    const stats = await memoryDb.getViewStats(period);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[Analytics Stats Error]:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
