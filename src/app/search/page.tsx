import React from "react";
import Link from "next/link";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { generateSeoMetadata } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import WhatsAppBanner from "@/components/WhatsAppBanner";
import { ArticleData } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";
  return generateSeoMetadata({
    title: query ? `Search Results for "${query}"` : "Search Todaynews.ng",
    description: "Search trending Nigerian news stories, Naira rates, and entertainment articles on Todaynews.ng.",
    path: "/search",
    noIndex: true, // Do not index search query pages to avoid duplicate content penalties
  });
}

async function searchArticles(query: string): Promise<ArticleData[]> {
  if (!query) return [];

  try {
    if (isDbConfigured()) {
      const dbArticles = await prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        },
        include: { pages: true },
        orderBy: { createdAt: "desc" },
      });
      if (dbArticles.length > 0) {
        return dbArticles.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          category: a.category,
          status: a.status,
          imageUrl: a.imageUrl || undefined,
          author: a.author,
          readTimeMinutes: a.readTimeMinutes,
          views: a.views,
          createdAt: a.createdAt.toISOString(),
          pages: a.pages,
        }));
      }
    }
  } catch (e) {
    console.error("DB Search failed, falling back to memory:", e);
  }

  const res: any = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 100);
  const all: ArticleData[] = res.articles || res;
  return all.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase())
  );
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";
  const results = await searchArticles(query);

  return (
    <div className="space-y-6 font-body">
      <div className="border-b-4 border-ink pb-4 mb-8">
        <span className="text-[10px] uppercase font-black tracking-widest text-flag font-mono">
          Search Engine
        </span>
        <h1 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-ink mt-1">
          {query ? `Search Results for "${query}"` : "Search Todaynews.ng"}
        </h1>
        <p className="text-xs text-muted mt-1">
          Found {results.length} reports matching your search parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white border border-ink/10 rounded">
              <p className="text-sm font-bold text-muted mb-2">No news items found matching "{query}".</p>
              <p className="text-xs text-muted mb-4">Try checking your spelling or use general keywords like "Naira" or "Tinubu".</p>
              <Link href="/" className="text-xs text-flag font-black underline uppercase">
                Return to Homepage
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <TrendingSidebar />
          <WhatsAppBanner />
        </div>
      </div>
    </div>
  );
}
