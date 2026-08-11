import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { paraphraseNews } from "@/lib/ai";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export async function POST(request: Request) {
  try {
    const { rawText, rawTitle, category, imageUrl } = await request.json();

    if (!rawText || !category) {
      return NextResponse.json({ error: "Missing required rawText or category" }, { status: 400 });
    }

    // Call Gemini AI Paraphrase / Page-Splitting service
    const paraphrased = await paraphraseNews(rawText, rawTitle || "Trending Story", category);

    const baseSlug = slugify(paraphrased.title);
    const slug = `${baseSlug}-${Math.floor(Math.random() * 900) + 100}`;

    let savedArticle;

    if (isDbConfigured()) {
      savedArticle = await prisma.article.create({
        data: {
          title: paraphrased.title,
          slug,
          summary: paraphrased.summary,
          category: paraphrased.category as any,
          status: "PENDING", // Editor must review before going live!
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop",
          readTimeMinutes: Math.max(1, Math.ceil(rawText.split(/\s+/).length / 200)),
          pages: {
            create: paraphrased.pages.map((p) => ({
              pageNumber: p.pageNumber,
              title: p.title || null,
              content: p.content,
            })),
          },
        },
        include: { pages: true },
      });
    } else {
      savedArticle = await memoryDb.createArticle({
        title: paraphrased.title,
        slug,
        summary: paraphrased.summary,
        category: paraphrased.category,
        status: "PENDING",
        author: "Adekunle Sulaimon",
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop",
        readTimeMinutes: Math.max(1, Math.ceil(rawText.split(/\s+/).length / 200)),
        pages: paraphrased.pages,
      });
    }

    return NextResponse.json(savedArticle);
  } catch (error) {
    console.error("Ingestion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
