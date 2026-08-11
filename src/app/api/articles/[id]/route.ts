import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { status, title, summary, category, pages } = data;

    if (isDbConfigured()) {
      if (status && !pages) {
        // Status only update
        const updated = await prisma.article.update({
          where: { id: params.id },
          data: { status: status as any },
        });
        return NextResponse.json(updated);
      } else {
        // Full edit update including pages
        // First delete old pages
        await prisma.articlePage.deleteMany({
          where: { articleId: params.id },
        });

        const updated = await prisma.article.update({
          where: { id: params.id },
          data: {
            title,
            summary,
            category: category as any,
            pages: {
              create: pages.map((p: any, idx: number) => ({
                pageNumber: idx + 1,
                title: p.title || null,
                content: p.content,
              })),
            },
          },
          include: { pages: true },
        });
        return NextResponse.json(updated);
      }
    } else {
      if (status && !pages) {
        const updated = await memoryDb.updateArticleStatus(params.id, status);
        return NextResponse.json(updated);
      } else {
        const updated = await memoryDb.updateArticlePages(params.id, title, summary, category, pages);
        return NextResponse.json(updated);
      }
    }
  } catch (error) {
    console.error("PUT Article status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      await prisma.article.delete({
        where: { id: params.id },
      });
    } else {
      await memoryDb.deleteArticle(params.id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Article error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
