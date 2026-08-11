import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { slug, category } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    if (isDbConfigured()) {
      await (prisma as any).pageView.create({
        data: {
          articleSlug: slug,
          category: category || "GENERAL",
        },
      });
      await prisma.article.updateMany({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    } else {
      await memoryDb.recordPageView(slug, category);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PageView Analytics Error]:", err);
    return NextResponse.json({ error: "Failed to record pageview" }, { status: 500 });
  }
}
