import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { generateSeoMetadata, getBreadcrumbsJsonLd } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import WhatsAppBanner from "@/components/WhatsAppBanner";
import NativeSponsoredFeed from "@/components/NativeSponsoredFeed";
import JsonLd from "@/components/JsonLd";
import { ArticleData } from "@/lib/sample-data";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const CATEGORY_MAP: Record<string, string> = {
  politics: "POLITICS",
  naira: "NAIRA",
  entertainment: "ENTERTAINMENT",
  sports: "SPORTS",
  security: "SECURITY",
  metro: "METRO",
  education: "EDUCATION",
  technology: "TECHNOLOGY",
  health: "HEALTH",
};

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const categoryKey = CATEGORY_MAP[params.slug.toLowerCase()];
  if (!categoryKey) return {};

  const readableName = params.slug.toUpperCase() === "NAIRA" ? "Naira Watch" : params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

  return generateSeoMetadata({
    title: `${readableName} News — Current Updates`,
    description: `Read latest Nigerian ${params.slug} news and reports. Updated hourly on Todaynews.ng.`,
    path: `/category/${params.slug}`,
    category: categoryKey,
  });
}

async function getCategoryArticles(categoryKey: string): Promise<ArticleData[]> {
  const articlesMap = new Map<string, ArticleData>();

  // 1. Fetch from Postgres DB if configured
  try {
    if (isDbConfigured()) {
      const dbArticles = await prisma.article.findMany({
        where: {
          category: categoryKey as any,
          status: "PUBLISHED",
        },
        include: { pages: { orderBy: { pageNumber: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      for (const a of dbArticles) {
        articlesMap.set(a.id, {
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          category: a.category,
          status: "PUBLISHED",
          imageUrl: a.imageUrl || undefined,
          author: a.author,
          readTimeMinutes: a.readTimeMinutes,
          views: a.views,
          createdAt: a.createdAt.toISOString(),
          pages: a.pages,
        });
      }
    }
  } catch (err) {
    console.error("DB Query failed in category page, proceeding with memory DB:", err);
  }

  // 2. Fetch from memoryDb as fallback or supplementary store
  try {
    const res = await memoryDb.getArticles(categoryKey, "PUBLISHED", 1, 50);
    const memArticles = (res.articles || []) as ArticleData[];
    for (const a of memArticles) {
      if (!articlesMap.has(a.id) && !Array.from(articlesMap.values()).some((item) => item.slug === a.slug)) {
        articlesMap.set(a.id, a);
      }
    }
  } catch (err) {
    console.error("MemoryDb query failed in category page:", err);
  }

  const combined = Array.from(articlesMap.values());
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return combined;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryKey = CATEGORY_MAP[params.slug.toLowerCase()];
  if (!categoryKey) {
    notFound();
  }

  const articles = await getCategoryArticles(categoryKey);
  const readableName = params.slug.toUpperCase() === "NAIRA" ? "Naira Watch" : params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

  // Yoast/RankMath style Breadcrumbs
  const breadcrumbSchema = getBreadcrumbsJsonLd([
    { name: "Home", item: "/" },
    { name: readableName, item: `/category/${params.slug}` },
  ]);

  return (
    <div className="space-y-6 font-body">
      <JsonLd schema={breadcrumbSchema} />

      {/* Category Banner Title */}
      <div className="border-b-4 border-ink pb-4 mb-8">
        <span className="text-[10px] uppercase font-black tracking-widest text-flag font-mono">
          Category Index
        </span>
        <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-ink uppercase mt-1">
          {readableName} News
        </h1>
        <p className="text-xs text-muted mt-2">
          Latest reports, trending narratives, and analytical reports in {readableName} section.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Feed list */}
        <div className="lg:col-span-2 space-y-6">
          {articles.length > 0 ? (
            <div className="space-y-6">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white border border-ink/10 rounded">
              <p className="text-sm font-bold text-muted mb-2">No news items found in {readableName}.</p>
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

      {/* Bottom Ad / recommendations */}
      <NativeSponsoredFeed />
    </div>
  );
}
