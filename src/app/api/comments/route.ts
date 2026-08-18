import { NextResponse } from "next/server";
import { prisma, isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public: fetch approved comments for one article, newest first. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");
    if (!articleId) {
      return NextResponse.json({ error: "articleId is required" }, { status: 400 });
    }
    if (!isDbConfigured()) return NextResponse.json({ comments: [] });

    const comments = await prisma.comment.findMany({
      where: { articleId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[Comments GET] Failed:", err);
    return NextResponse.json({ comments: [] });
  }
}

/** Public: submit a comment. Always lands PENDING — never shown until an admin approves it. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const articleId = (body.articleId || "").toString().trim();
    const authorName = (body.authorName || "").toString().trim().slice(0, 80);
    const authorEmail = body.authorEmail ? body.authorEmail.toString().trim().slice(0, 200) : undefined;
    const content = (body.content || "").toString().trim().slice(0, 2000);

    if (!articleId || !authorName || !content) {
      return NextResponse.json({ error: "Name and comment text are required." }, { status: 400 });
    }
    if (content.length < 3) {
      return NextResponse.json({ error: "Comment is too short." }, { status: 400 });
    }
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Comments are temporarily unavailable." }, { status: 503 });
    }
    // Basic spam guard: reject comments that are mostly a URL/link dump.
    const linkCount = (content.match(/https?:\/\//gi) || []).length;
    if (linkCount > 1) {
      return NextResponse.json({ error: "Comment could not be submitted." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: { articleId, authorName, authorEmail, content, status: "PENDING" },
    });

    return NextResponse.json({
      success: true,
      comment,
      message: "Thanks! Your comment is awaiting moderation and will appear once approved.",
    });
  } catch (err) {
    console.error("[Comments POST] Failed:", err);
    return NextResponse.json({ error: "Failed to submit comment." }, { status: 500 });
  }
}
