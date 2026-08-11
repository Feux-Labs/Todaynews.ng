import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    let list = [];
    if (isDbConfigured()) {
      list = await prisma.article.findMany({
        where: {
          category: category ? (category.toUpperCase() as any) : undefined,
          status: status ? (status.toUpperCase() as any) : undefined,
        },
        include: { pages: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      list = await memoryDb.getArticles(category, status);
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET Articles API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
