import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { resolveStoryImage } from "@/lib/scraper";

export const dynamic = "force-dynamic";

/**
 * SYSTEM DESIGN: Paginated & Cached Articles API
 * Supports query params: ?category=POLITICS&status=PUBLISHED&page=1&limit=10
 * Implements HTTP cache control headers to reduce server load.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const effectiveStatus = status || "PUBLISHED";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const rawLimit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const limit = Math.min(500, Math.max(1, rawLimit)); // Cap max limit at 500 to allow full admin listings

    if (isDbConfigured()) {
      const where: any = {};
      if (category) where.category = category.toUpperCase();
      const statuses = effectiveStatus
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];

      try {
        const total = await prisma.article.count({ where });
        const articles = await prisma.article.findMany({
          where,
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: "desc" },
          include: { pages: { orderBy: { pageNumber: "asc" } } },
        });

        const response = NextResponse.json({
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: (page - 1) * limit + limit < total,
          articles,
        });

        if (status === "PUBLISHED" || !status) {
          response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
        }

        return response;
      } catch (dbErr) {
        console.error("[API Articles GET DB fallback]:", dbErr);
      }
    }

    // Memory fallback paginated response
    if (effectiveStatus.includes(",")) {
      const statuses = effectiveStatus.split(",").map((item) => item.trim()).filter(Boolean);
      const combined = await Promise.all(statuses.map((item) => memoryDb.getArticles(category, item, 1, 100)));
      const articles = combined
        .flatMap((result) => result.articles)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const startIndex = (page - 1) * limit;
      return NextResponse.json({
        total: articles.length,
        page,
        limit,
        totalPages: Math.ceil(articles.length / limit),
        hasMore: startIndex + limit < articles.length,
        articles: articles.slice(startIndex, startIndex + limit),
      });
    }

    const result = await memoryDb.getArticles(category, effectiveStatus, page, limit);
    const response = NextResponse.json(result);

    if (status === "PUBLISHED" || !status) {
      response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }

    return response;
  } catch (err) {
    console.error("[API Articles GET Error]:", err);
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      summary,
      category,
      pages,
      imageUrl,
      sourceName,
      author,
      status,
      readTimeMinutes,
      scheduledAt,
    } = body;

    if (!title || !summary || !category) {
      return NextResponse.json({ error: "Missing required fields: title, summary, category" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 60);

    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

    const resolvedImage = await resolveStoryImage(
      imageUrl,
      title,
      category,
      sourceName
    );

    const requestedStatus = (status || "DRAFT").toString().toUpperCase();
    const hasScheduleDate = Boolean(scheduledAt);
    const resolvedStatus = hasScheduleDate && requestedStatus === "PUBLISHED" ? "SCHEDULED" : requestedStatus;
    const resolvedScheduledAt = hasScheduleDate ? new Date(scheduledAt) : undefined;
    const resolvedAuthor = (author || "Todaynews.ng Editorial").toString().trim();
    const resolvedReadTime = Number(readTimeMinutes) || 3;
    const resolvedPages = pages && pages.length > 0
      ? pages
      : [{ pageNumber: 1, content: summary }];

    if (isDbConfigured()) {
      try {
        const created = await prisma.article.create({
          data: {
            title,
            slug: uniqueSlug,
            summary,
            category: category.toUpperCase() as any,
            status: resolvedStatus as any,
            scheduledAt: resolvedScheduledAt,
            imageUrl: resolvedImage.url,
            imageCredit: resolvedImage.credit,
            sourceName: sourceName || "Manual Editorial",
            author: resolvedAuthor,
            readTimeMinutes: resolvedReadTime,
            pages: {
              create: resolvedPages.map((p: any, idx: number) => ({
                pageNumber: idx + 1,
                title: p.title || null,
                content: p.content || summary,
              })),
            },
          },
          include: { pages: { orderBy: { pageNumber: "asc" } } },
        });
        return NextResponse.json(created, { status: 201 });
      } catch (dbErr) {
        console.error("[API Articles POST DB fallback]:", dbErr);
      }
    }

    const created = await memoryDb.createArticle({
      title,
      slug: uniqueSlug,
      summary,
      category: category.toUpperCase() as any,
      status: resolvedStatus as any,
      imageUrl: resolvedImage.url,
      imageCredit: resolvedImage.credit,
      sourceName: sourceName || "Manual Editorial",
      author: resolvedAuthor,
      readTimeMinutes: resolvedReadTime,
      pages: resolvedPages,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[API Articles POST Error]:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}