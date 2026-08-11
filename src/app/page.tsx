import React from "react";
import Link from "next/link";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { generateSeoMetadata } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import NairaRateWidget from "@/components/NairaRateWidget";
import NativeSponsoredFeed from "@/components/NativeSponsoredFeed";
import WhatsAppBanner from "@/components/WhatsAppBanner";
import AdSlot from "@/components/AdSlot";
import { ArticleData } from "@/lib/sample-data";

export const revalidate = 60; // Revalidate every 60 seconds

export const metadata = generateSeoMetadata({
  title: "Todaynews.ng — Breaking Nigerian News, Naira Rates & Gist",
  description: "Read breaking Nigerian news on politics, business, parallel Naira exchange rates, sports, entertainment, security, and BBNaija updates.",
  path: "/",
});

async function getPublishedArticles(): Promise<ArticleData[]> {
  try {
    if (isDbConfigured()) {
      const dbArticles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { pages: true },
        orderBy: { createdAt: "desc" },
      });
      if (dbArticles.length > 0) {
        // Map Prisma model back to standard interface
        return dbArticles.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          category: a.category,
          status: a.status,
          sourceUrl: a.sourceUrl || undefined,
          sourceName: a.sourceName || undefined,
          imageUrl: a.imageUrl || undefined,
          author: a.author,
          readTimeMinutes: a.readTimeMinutes,
          views: a.views,
          createdAt: a.createdAt.toISOString(),
          pages: a.pages,
        }));
      }
    }
  } catch (err) {
    console.error("Database connection failed, falling back to memory database:", err);
  }

  const res = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 50);
  return (res.articles || (res as any)) as any;
}

export default async function HomePage() {
  const articles = await getPublishedArticles();

  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 3);
  const remainingArticles = articles.slice(3);

  const newsOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Todaynews.ng",
    "url": "https://todaynews.ng",
    "logo": "https://todaynews.ng/images/logo-publisher.png",
    "sameAs": [
      "https://facebook.com/todaynewsng",
      "https://twitter.com/todaynewsng",
      "https://instagram.com/todaynewsng"
    ],
    "publishingPrinciples": "https://todaynews.ng/editorial-standards",
    "correctionsPolicy": "https://todaynews.ng/editorial-standards#corrections",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressCountry": "NG"
    }
  };

  return (
    <div className="space-y-8 font-body">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsOrgJsonLd) }}
      />
      {/* ================= HERO GRID ================= */}

      {heroArticle && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Card (Large Feature) */}
          <div className="lg:col-span-2 bg-white border border-ink/5 rounded overflow-hidden shadow-sm hover:shadow transition-shadow group flex flex-col justify-between">
            <div>
              {heroArticle.imageUrl && (
                <div className="relative aspect-video overflow-hidden border-b border-ink/5">
                  <img
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-punchRed text-paper text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow">
                    Featured story
                  </span>
                </div>
              )}
              <div className="p-6">
                <span className="text-[10px] uppercase font-black tracking-widest text-flag block mb-2">
                  {heroArticle.category} • {new Date(heroArticle.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                </span>
                <h2 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-ink hover:text-flag transition-colors leading-tight">
                  <Link href={`/article/${heroArticle.slug}`}>
                    {heroArticle.title}
                  </Link>
                </h2>
                <p className="text-sm text-muted mt-3 leading-relaxed">
                  {heroArticle.summary}
                </p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-ink/5 mt-4 text-xs text-muted font-bold uppercase tracking-wider">
              <span>By {heroArticle.author}</span>
              <span className="text-flag hover:underline font-extrabold">
                <Link href={`/article/${heroArticle.slug}`}>Read Full Story →</Link>
              </span>
            </div>
          </div>

          {/* Secondary Hero Sidebar (2 items stacked) */}
          <div className="flex flex-col gap-6">
            {sideArticles.map((article) => (
              <div
                key={article.slug}
                className="bg-white border border-ink/5 p-5 rounded shadow-sm hover:shadow transition-shadow group flex flex-col justify-between flex-1"
              >
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-flag block mb-1">
                    {article.category}
                  </span>
                  <h3 className="font-display font-black text-lg text-ink group-hover:text-flag transition-colors leading-snug">
                    <Link href={`/article/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted mt-2 line-clamp-3 leading-relaxed">
                    {article.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-ink/5 mt-4 pt-2 text-[10px] text-muted font-bold uppercase tracking-wider">
                  <span>⏱ {article.readTimeMinutes} Min Read</span>
                  <span className="text-flag">Read More →</span>
                </div>
              </div>
            ))}
            
            {/* Quick Micro-Banner Ad slot */}
            <div className="bg-hazard/10 border-2 border-dashed border-hazard/40 p-4 rounded flex items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase text-ink tracking-wider">
                💵 Naira trades steady at parallel market today. check rates below!
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ================= NAIRA RATE WIDGET ================= */}
      <section>
        <NairaRateWidget />
      </section>

      {/* ================= MAIN CONTENT COLUMNS ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Latest News Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b-4 border-ink pb-2 mb-6">
            <h2 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight">
              Latest Headlines
            </h2>
          </div>

          {remainingArticles.length > 0 ? (
            <div className="space-y-6">
              {remainingArticles.map((article, idx) => (
                <React.Fragment key={article.slug}>
                  <ArticleCard article={article} />
                  {/* Ad Inserter Equivalent: Injects middle display ad after the 2nd article */}
                  {idx === 1 && (
                    <AdSlot id="mid-feed-adsterra" type="in-article-mid" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white border border-ink/10 rounded">
              <p className="text-xs font-bold text-muted">No additional news stories available at this time.</p>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (PostViews trending widget, WhatsApp widget) */}
        <div className="space-y-6">
          {/* Trending list */}
          <TrendingSidebar />

          {/* Adsterra Native Sidebar Display placement */}
          <AdSlot id="sidebar-display-adsterra" type="sidebar-native" />

          {/* WhatsApp viral channel banner */}
          <WhatsAppBanner />

          {/* About Widget */}
          <div className="border-2 border-ink p-5 rounded bg-paper/50">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink border-b border-ink/10 pb-2 mb-3">
              About Todaynews.ng
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              We leverage expert local editors and state-of-the-art AI systems to source and compile accurate reports across Nigeria. All articles are carefully copy-edited to eliminate factual errors before they go live on our website.
            </p>
          </div>
        </div>
      </section>

      {/* ================= NATIVE RECOMMENDED GRID (TABOOLA EQUIVALENT) ================= */}
      <section>
        <NativeSponsoredFeed />
      </section>
    </div>
  );
}
