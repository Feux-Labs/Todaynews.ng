import React from "react";
import Link from "next/link";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { generateSeoMetadata } from "@/lib/seo";
import ArticleCard from "@/components/ArticleCard";
import TrendingSidebar from "@/components/TrendingSidebar";
import NairaRateWidget from "@/components/NairaRateWidget";
import WhatsAppBanner from "@/components/WhatsAppBanner";
import AdSlot from "@/components/AdSlot";
import { ArticleData } from "@/lib/sample-data";
import { ShieldCheck, ArrowRight, Zap } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = generateSeoMetadata({
  title: "Todaynews.ng — Breaking Nigerian News, Security Alerts & Naira Rates",
  description: "Read breaking Nigerian news on security updates, politics, parallel Naira exchange rates, sports, entertainment, and investigative reports updated all day.",
  path: "/",
});

function cleanSummary(text?: string): string {
  if (!text) return "";
  return text
    .replace(/Read More:?\s*https?:\/\/[^\s]+/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/The post .* appeared first on .*/gi, "")
    .replace(/Copyright © .*/gi, "")
    .trim();
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  POLITICS: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
  NAIRA: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  ENTERTAINMENT: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
  SPORTS: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  SECURITY: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
  METRO: "https://images.unsplash.com/photo-1577975882846-431adc8c2009?auto=format&fit=crop&w=800&q=80",
  EDUCATION: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  TECHNOLOGY: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  HEALTH: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
  DEFAULT: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
};

async function getPublishedArticles(): Promise<ArticleData[]> {
  const articlesMap = new Map<string, ArticleData>();

  // 1. Fetch from Postgres DB if configured
  try {
    if (isDbConfigured()) {
      const dbArticles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { pages: { orderBy: { pageNumber: "asc" } } },
        orderBy: { createdAt: "desc" },
      });
      for (const a of dbArticles) {
        articlesMap.set(a.id, {
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: cleanSummary(a.summary),
          category: a.category,
          status: "PUBLISHED",
          sourceUrl: a.sourceUrl || undefined,
          sourceName: "Todaynews AI",
          imageUrl: a.imageUrl || CATEGORY_FALLBACK_IMAGES[a.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT,
          author: a.author,
          readTimeMinutes: a.readTimeMinutes || 3,
          views: a.views || 0,
          createdAt: a.createdAt.toISOString(),
          pages: a.pages,
        });
      }
    }
  } catch (err) {
    console.error("Database query failed in homepage, proceeding with memory DB:", err);
  }

  // 2. Fetch from memoryDb as fallback or supplementary store
  try {
    const res = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 50);
    const memArticles = (res.articles || []) as ArticleData[];
    for (const a of memArticles) {
      if (!articlesMap.has(a.id) && !Array.from(articlesMap.values()).some((item) => item.slug === a.slug)) {
        articlesMap.set(a.id, {
          ...a,
          summary: cleanSummary(a.summary),
          sourceName: "Todaynews AI",
          imageUrl: a.imageUrl || CATEGORY_FALLBACK_IMAGES[a.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT,
        });
      }
    }
  } catch (err) {
    console.error("MemoryDb query failed in homepage:", err);
  }

  const combined = Array.from(articlesMap.values());
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return combined;
}

export default async function HomePage() {
  const articles = await getPublishedArticles();

  const heroArticle = articles[0];
  const sideArticles = articles.slice(1, 3);
  const securityArticles = articles.filter((a) => a.category === "SECURITY" || a.category === "METRO").slice(0, 4);
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
    <div className="space-y-6 font-body w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsOrgJsonLd) }}
      />

      {/* ================= HERO SPOTLIGHT GRID (PUNCH STYLE) ================= */}
      {heroArticle && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Large Hero Spotlight Feature */}
          <div className="lg:col-span-2 bg-white border-2 border-ink rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div>
              <div className="relative aspect-video overflow-hidden border-b-2 border-ink bg-ink/5">
                <img
                  src={heroArticle.imageUrl || CATEGORY_FALLBACK_IMAGES[heroArticle.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT}
                  alt={heroArticle.title}
                  className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-punchRed text-paper text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow">
                  🔥 Top Spotlight
                </span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-flag text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded font-mono">
                    {heroArticle.category}
                  </span>
                  <span className="text-xs text-muted font-bold">
                    {new Date(heroArticle.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-ink hover:text-flag transition-colors leading-tight">
                  <Link href={`/article/${heroArticle.slug}`}>
                    {heroArticle.title}
                  </Link>
                </h2>
                <p className="text-sm text-muted mt-3 leading-relaxed line-clamp-3">
                  {heroArticle.summary}
                </p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-ink/10 mt-4 text-xs text-muted font-bold uppercase tracking-wider">
              <span>By {heroArticle.author || "Todaynews AI"}</span>
              <Link href={`/article/${heroArticle.slug}`} className="text-flag hover:underline font-black flex items-center gap-1">
                <span>Read Full Story</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Secondary Hero Sidebar (Punch 2-Card Stack with Images) */}
          <div className="flex flex-col gap-4">
            {sideArticles.map((article) => (
              <div
                key={article.slug}
                className="bg-white border-2 border-ink p-4 rounded-lg shadow-sm hover:shadow-md transition-all group flex flex-col justify-between flex-1"
              >
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 rounded overflow-hidden shrink-0 border border-ink/10 bg-ink/5">
                    <img
                      src={article.imageUrl || CATEGORY_FALLBACK_IMAGES[article.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-black tracking-widest text-flag block mb-0.5 font-mono">
                      {article.category}
                    </span>
                    <h3 className="font-display font-black text-sm text-ink group-hover:text-flag transition-colors leading-snug line-clamp-2">
                      <Link href={`/article/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                  {article.summary}
                </p>

                <div className="flex items-center justify-between border-t border-ink/10 mt-3 pt-2 text-[10px] text-muted font-bold uppercase tracking-wider">
                  <span>⏱ {article.readTimeMinutes || 3} Min Read</span>
                  <Link href={`/article/${article.slug}`} className="text-flag font-black hover:underline">
                    Read Story →
                  </Link>
                </div>
              </div>
            ))}
            
            {/* Smartlink Deals Strip */}
            <AdSlot id="hero-smartlink" type="smartlink" />
          </div>
        </section>
      )}

      {/* ================= NAIRA RATE WATCH WIDGET ================= */}
      <section className="w-full">
        <NairaRateWidget />
      </section>

      {/* ================= SECURITY & METRO SECTION ================= */}
      <section className="bg-paper border-2 border-ink p-5 rounded-lg shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between border-b-2 border-ink pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-punchRed" />
            <h2 className="font-display font-black text-xl text-ink uppercase tracking-tight">
              Security & Metro Safety Alert
            </h2>
          </div>
          <Link href="/category/security" className="text-xs text-flag font-black uppercase hover:underline">
            View All Security News →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(securityArticles.length > 0 ? securityArticles : articles.slice(0, 4)).map((story) => (
            <div key={story.slug} className="p-3 border border-ink/10 rounded-lg bg-white hover:border-flag transition-all flex gap-3 items-start shadow-sm">
              <div className="w-20 h-20 rounded overflow-hidden shrink-0 border border-ink/10 bg-ink/5">
                <img
                  src={story.imageUrl || CATEGORY_FALLBACK_IMAGES[story.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase text-punchRed bg-punchRed/10 px-1.5 py-0.5 rounded font-mono">
                  {story.category}
                </span>
                <h4 className="font-display font-bold text-sm text-ink hover:text-flag transition-colors mt-1 leading-snug line-clamp-2">
                  <Link href={`/article/${story.slug}`}>{story.title}</Link>
                </h4>
                <p className="text-[11px] text-muted line-clamp-1 mt-1">{story.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= MAIN CONTENT COLUMNS (LATEST NEWS + SIDEBAR) ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Left Column: Latest News Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-b-4 border-ink pb-2 flex items-center justify-between">
            <h2 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-flag fill-current" />
              Latest News Stream
            </h2>
            <span className="text-xs text-muted font-bold font-mono">Updated Every 30 Mins</span>
          </div>

          {remainingArticles.length > 0 ? (
            <div className="space-y-4">
              {remainingArticles.map((article, idx) => (
                <React.Fragment key={article.slug}>
                  <ArticleCard article={article} />
                  {/* Ad Inserter: Injects middle display ad after the 2nd article */}
                  {idx === 1 && (
                    <AdSlot id="mid-feed-adsterra" type="in-article-mid" />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white border border-ink/10 rounded-lg">
              <p className="text-xs font-bold text-muted">No additional news stories available at this time.</p>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (Trending, Adsterra Native, WhatsApp Channel) */}
        <div className="space-y-6">
          {/* Trending ranking list */}
          <TrendingSidebar articles={articles} />

          {/* Adsterra Native Sidebar Placement */}
          <AdSlot id="sidebar-display-adsterra" type="sidebar-native" />

          {/* WhatsApp Channel Join Banner */}
          <WhatsAppBanner />

          {/* Anti-Misinformation Mission Card */}
          <div className="border-2 border-ink p-5 rounded-lg bg-paper shadow-sm space-y-2">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink border-b border-ink/10 pb-2">
              Mission Statement
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Todaynews.ng is a Nigerian AI-powered news channel focusing on reducing misinformation and news censorship using complex algorithms to locate important security news to keep Nigerians safe.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
