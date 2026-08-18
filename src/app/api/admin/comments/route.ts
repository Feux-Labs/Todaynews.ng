import { NextResponse } from "next/server";
import { prisma, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin: list comments, optionally filtered by status (defaults to PENDING queue). */
export async function GET(req: Request) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ comments: [] });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const comments = await prisma.comment.findMany({
      where: status && status !== "ALL" ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const articleIds = Array.from(new Set(comments.map((c) => c.articleId)));
    const articles = articleIds.length
      ? await prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, title: true, slug: true },
        })
      : [];
    const articleById = Object.fromEntries(articles.map((a) => [a.id, a]));

    return NextResponse.json({
      comments: comments.map((c) => ({ ...c, article: articleById[c.articleId] || null })),
    });
  } catch (err) {
    console.error("[Admin Comments GET] Failed:", err);
    return NextResponse.json({ comments: [] });
  }
}
