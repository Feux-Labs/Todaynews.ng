import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { status, title, summary, category, author } = data;

    if (isDbConfigured()) {
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (category !== undefined) updateData.category = category;
      if (author !== undefined) updateData.author = author;

      const updated = await prisma.article.update({
        where: { id: params.id },
        data: updateData,
      });
      return NextResponse.json(updated);
    } else {
      const updated = await memoryDb.updateArticle(params.id, data);
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("PATCH Article status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { status, title, summary, category, pages, author } = data;

    if (isDbConfigured()) {
      if (status && !pages) {
        const updated = await prisma.article.update({
          where: { id: params.id },
          data: { status: status as any, author: author || undefined },
        });
        return NextResponse.json(updated);
      } else {
        await prisma.articlePage.deleteMany({
          where: { articleId: params.id },
        });

        const updated = await prisma.article.update({
          where: { id: params.id },
          data: {
            title,
            summary,
            category: category as any,
            author: author || undefined,
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
    console.error("PUT Article error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      // Allow deleting by id or slug
      await prisma.article.deleteMany({
        where: { OR: [{ id: params.id }, { slug: params.id }] },
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
