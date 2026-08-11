import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
    const limit = Math.min(50, Math.max(1, rawLimit)); // Cap max limit at 50 to prevent huge queries

    if (isDbConfigured()) {
      const where: any = {};
      if (category) where.category = category.toUpperCase();
      if (status) where.status = status.toUpperCase();

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

      // System Design: Add Edge Caching Headers for Public Published Articles
      if (status === "PUBLISHED" || !status) {
        response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      }

      return response;
    }

    // Memory fallback paginated response
    const result = await memoryDb.getArticles(category, status, page, limit);
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
    const { title, summary, category, pages, imageUrl, sourceName } = body;

    if (!title || !summary || !category) {
      return NextResponse.json({ error: "Missing required fields: title, summary, category" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 60);

    const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

    if (isDbConfigured()) {
      const created = await prisma.article.create({
        data: {
          title,
          slug: uniqueSlug,
          summary,
          category: category.toUpperCase(),
          status: "DRAFT" as any,
          imageUrl,
          sourceName: sourceName || "Manual Editorial",
          pages: {
            create: (pages || [{ pageNumber: 1, content: summary }]).map((p: any, idx: number) => ({
              pageNumber: idx + 1,
              title: p.title || null,
              content: p.content,
            })),
          },
        },
      });
      return NextResponse.json(created, { status: 201 });
    }

    const created = await memoryDb.createArticle({
      title,
      slug: uniqueSlug,
      summary,
      category: category.toUpperCase(),
      status: "DRAFT" as any,
      imageUrl,
      sourceName: sourceName || "Manual Editorial",
      author: "Todaynews.ng Editorial",
      readTimeMinutes: 3,
      pages: pages || [{ pageNumber: 1, content: summary }],
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[API Articles POST Error]:", err);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
