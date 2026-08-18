import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { notifyNewPublish } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      try {
        const article = await prisma.article.findUnique({
          where: { id: params.id },
          include: { pages: { orderBy: { pageNumber: "asc" } } },
        });
        if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(article);
      } catch (dbErr) {
        console.error("[GET Article DB fallback]:", dbErr);
      }
    }
    const article = await memoryDb.getArticleById(params.id);
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (error) {
    console.error("GET Article error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { status, title, summary, category, author, scheduledAt, imageUrl } = data;
    const requestedStatus = status?.toString().toUpperCase();
    const nextStatus = scheduledAt && requestedStatus === "PUBLISHED" ? "SCHEDULED" : requestedStatus;

    if (isDbConfigured()) {
      try {
        const existing = await prisma.article.findUnique({ where: { id: params.id }, select: { status: true } });

        const updateData: any = {};
        if (status !== undefined) updateData.status = nextStatus;
        if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
        else if (nextStatus === "PUBLISHED") updateData.scheduledAt = null;
        if (title !== undefined) updateData.title = title;
        if (summary !== undefined) updateData.summary = summary;
        if (category !== undefined) updateData.category = category;
        if (author !== undefined) updateData.author = author;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

        const updated = await prisma.article.update({
          where: { id: params.id },
          data: updateData,
        });

        if (nextStatus === "PUBLISHED" && existing?.status !== "PUBLISHED") {
          notifyNewPublish({ id: updated.id, title: updated.title, slug: updated.slug, summary: updated.summary }).catch(() => {});
        }

        return NextResponse.json(updated);
      } catch (dbErr) {
        console.error("[PATCH Article DB fallback]:", dbErr);
      }
    }
    const updated = await memoryDb.updateArticle(params.id, data);
    return NextResponse.json(updated);
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
      const { status, title, summary, category, pages, author, imageUrl, readTimeMinutes, scheduledAt } = data;
      const requestedStatus = status?.toString().toUpperCase();
      const nextStatus = scheduledAt && requestedStatus === "PUBLISHED" ? "SCHEDULED" : requestedStatus;

    if (isDbConfigured()) {
      try {
        const existing = await prisma.article.findUnique({ where: { id: params.id }, select: { status: true } });
        const willTransitionToPublished = nextStatus === "PUBLISHED" && existing?.status !== "PUBLISHED";

        // Status-only update (e.g. approve from inbox)
        if (status && !pages && !title) {
          const updated = await prisma.article.update({
            where: { id: params.id },
            data: {
              status: nextStatus as any,
              author: author || undefined,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : nextStatus === "PUBLISHED" ? null : undefined,
            },
          });
          if (willTransitionToPublished) {
            notifyNewPublish({ id: updated.id, title: updated.title, slug: updated.slug, summary: updated.summary }).catch(() => {});
          }
          return NextResponse.json(updated);
        }

        await prisma.articlePage.deleteMany({
          where: { articleId: params.id },
        });

        const updateData: any = {
          ...(title !== undefined && { title }),
          ...(summary !== undefined && { summary }),
          ...(category !== undefined && { category: category.toUpperCase() as any }),
          ...(author !== undefined && { author }),
          ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
          ...(readTimeMinutes !== undefined && { readTimeMinutes: Number(readTimeMinutes) || 3 }),
          ...(status !== undefined && { status: nextStatus as any }),
          ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
          ...(scheduledAt === undefined && nextStatus === "PUBLISHED" && { scheduledAt: null }),
        };

        if (pages && pages.length > 0) {
          updateData.pages = {
            create: pages.map((p: any, idx: number) => ({
              pageNumber: idx + 1,
              title: p.title || null,
              content: p.content || summary,
            })),
          };
        }

        const updated = await prisma.article.update({
          where: { id: params.id },
          data: updateData,
          include: { pages: { orderBy: { pageNumber: "asc" } } },
        });
        if (willTransitionToPublished) {
          notifyNewPublish({ id: updated.id, title: updated.title, slug: updated.slug, summary: updated.summary }).catch(() => {});
        }
        return NextResponse.json(updated);
      } catch (dbErr) {
        console.error("[PUT Article DB fallback]:", dbErr);
      }
    }
    if (status && !pages && !title) {
      const updated = await memoryDb.updateArticleStatus(params.id, status);
      return NextResponse.json(updated);
    }
    const updated = await memoryDb.updateArticle(params.id, data);
    return NextResponse.json(updated);
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
      try {
        await prisma.article.deleteMany({
          where: { OR: [{ id: params.id }, { slug: params.id }] },
        });
        return NextResponse.json({ success: true });
      } catch (dbErr) {
        console.error("[DELETE Article DB fallback]:", dbErr);
      }
    }
    await memoryDb.deleteArticle(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Article error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
