import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Eye, Calendar, User, MessageSquare } from "lucide-react";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";
import { generateSeoMetadata, getNewsArticleJsonLd, getBreadcrumbsJsonLd } from "@/lib/seo";
import SocialShareBar from "@/components/SocialShareBar";
import ClickToQuote from "@/components/ClickToQuote";
import EmojiReactions from "@/components/EmojiReactions";
import AdSlot from "@/components/AdSlot";
import MidArticleRelatedNews from "@/components/MidArticleRelatedNews";
import TrendingSidebar from "@/components/TrendingSidebar";
import WhatsAppBanner from "@/components/WhatsAppBanner";
import Pagination from "@/components/Pagination";
import JsonLd from "@/components/JsonLd";
import PageViewBeacon from "@/components/PageViewBeacon";
import { ArticleData } from "@/lib/sample-data";
import { sanitizeArticleHtml } from "@/lib/content";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

async function getArticle(slug: string): Promise<ArticleData | null> {
  // 1. Try Prisma DB if configured
  try {
    if (isDbConfigured()) {
      const publishedArticle = await prisma.article.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
          status: "PUBLISHED",
        },
        include: { pages: { orderBy: { pageNumber: "asc" } } },
      });

      if (publishedArticle) {
        try {
          await prisma.article.update({
            where: { id: publishedArticle.id },
            data: { views: { increment: 1 } },
          });
        } catch {}

        return {
          id: publishedArticle.id,
          title: publishedArticle.title,
          slug: publishedArticle.slug,
          summary: publishedArticle.summary,
          category: publishedArticle.category,
          status: "PUBLISHED",
          imageUrl: publishedArticle.imageUrl || undefined,
          author: publishedArticle.author,
          readTimeMinutes: publishedArticle.readTimeMinutes,
          views: publishedArticle.views + 1,
          createdAt: publishedArticle.createdAt.toISOString(),
          pages: publishedArticle.pages,
        };
      }
    }
  } catch (err) {
    console.error("DB Query failed in article page, proceeding with memory DB:", err);
  }

  // 2. Fallback to memoryDb
  const memBySlug = await memoryDb.getArticleBySlug(slug);
  if (memBySlug) return memBySlug as any;
  const memById = await memoryDb.getArticleById(slug);
  if (memById) return memById as any;

  return null;
}

export async function generateMetadata({ params, searchParams }: ArticlePageProps) {
  const article = await getArticle(params.slug);
  if (!article) return {};

  const pageNum = Number.parseInt(searchParams.page || "1", 10);
  const totalPages = article.pages?.length || 1;
  
  // Dynamic page title to optimize for target keyword variants
  const pageSuffix = totalPages > 1 ? ` - Page ${pageNum} of ${totalPages}` : "";
  const title = `${article.title}${pageSuffix}`;

  return generateSeoMetadata({
    title,
    description: article.summary,
    path: `/article/${article.slug}${pageNum > 1 ? `?page=${pageNum}` : ""}`.replace(/\?page=1$/, ""),
    imageUrl: article.imageUrl || undefined,
    category: article.category,
    keywords: [article.title, article.category, "Nigeria news", "Latest Naija Gist"],
  });
}

export default async function ArticlePage({ params, searchParams }: Readonly<ArticlePageProps>) {
  const article = await getArticle(params.slug);
  if (!article) {
    notFound();
  }

  const currentPage = Number.parseInt(searchParams.page || "1", 10);
  const totalPages = article.pages?.length || 1;

  // Sanity check current page limits
  if (currentPage < 1 || currentPage > totalPages) {
    notFound();
  }

  const currentPageData = article.pages?.[currentPage - 1];
  const nextPageData = currentPage < totalPages ? article.pages?.[currentPage] : null;

  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Yoast schemas
  const articleJsonLd = getNewsArticleJsonLd({
    headline: article.title,
    description: article.summary,
    imageUrl: article.imageUrl || `${process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng"}/images/og-default.jpg`,
    datePublished: article.createdAt,
    dateModified: article.createdAt,
    authorName: article.author,
    slug: article.slug,
    category: article.category,
  });

  const breadcrumbsJsonLd = getBreadcrumbsJsonLd([
    { name: "Home", item: "/" },
    { name: article.category, item: `/category/${article.category.toLowerCase()}` },
    { name: article.title, item: `/article/${article.slug}` },
  ]);

  return (
    <div className="space-y-3 font-body">
      <PageViewBeacon slug={article.slug} category={article.category} />
      <JsonLd schema={articleJsonLd} />
      <JsonLd schema={breadcrumbsJsonLd} />

      {/* --- Breadcrumb link path UI --- */}
      <div className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
        <Link href="/" className="hover:text-flag">Home</Link>
        <span>/</span>
        <Link href={`/category/${article.category.toLowerCase()}`} className="hover:text-flag">
          {article.category}
        </Link>
        <span>/</span>
        <span className="truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left/Center Column: Article Content */}
        <div className="lg:col-span-2 bg-white border border-ink/5 p-4 md:p-6 rounded shadow-sm">
          
          {/* Headline & Category badge */}
          <span className="bg-flag text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded font-mono">
            {article.category}
          </span>
          <h1 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-ink leading-tight mt-3">
            {article.title}
          </h1>

          {/* Meta statistics bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted font-bold uppercase tracking-wider py-4 border-b border-ink/10 my-4">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-flag" /> By {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-flag" /> {formattedDate}
            </span>
            <span className="flex items-center gap-1 font-mono text-flag">
              <Eye className="h-3.5 w-3.5 fill-current" /> {article.views.toLocaleString()} Views
            </span>
          </div>

          {/* Floating Share Sidebars on desktop */}
          <SocialShareBar url={`/article/${article.slug}`} title={article.title} isFloating />

          {/* Article Image Banner */}
          {article.imageUrl && currentPage === 1 && (
            <div className="relative aspect-video w-full overflow-hidden rounded border border-ink/5 my-6">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Headline page indicator */}
          {totalPages > 1 && (
            <div className="bg-ink/5 p-2 rounded text-[11px] font-black uppercase tracking-widest text-muted border-l-4 border-flag flex justify-between items-center my-4 font-mono">
              <span>Reading: Part {currentPage} of {totalPages}</span>
              <span className="text-flag">{currentPageData?.title || "Story Continuation"}</span>
            </div>
          )}

          {/* ================= ARTICLE BODY ================= */}
          <div
            className="text-base text-ink leading-relaxed font-body space-y-4 pt-2"
            dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(currentPageData?.content || "") }}
          />

          {/* YARPP / Contextual related stories injected mid-way on multi-pages */}
          {currentPage === 1 && (
            <MidArticleRelatedNews currentCategory={article.category} excludeSlug={article.slug} />
          )}

          {/* Click to Quote custom WhatsApp trigger block */}
          {currentPage === 1 && (
            <ClickToQuote
              quote={article.summary}
              context={`Highlight from ${article.category}`}
            />
          )}

          {/* Inline display ads after page 1 paragraphs */}
          <AdSlot id={`in-article-ad-${currentPage}`} type="in-article-mid" />

          {/* ================= PAGINATION ACTIONS ================= */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            slug={article.slug}
            nextPageTitle={nextPageData ? nextPageData.title || `Part ${currentPage + 1}` : undefined}
          />

          {/* Inline Mobile Share Badges */}
          <SocialShareBar url={`/article/${article.slug}`} title={article.title} />

          {/* Emoji Reaction poll */}
          <EmojiReactions articleId={article.id} />

          {/* Author Biography Section (Punch-style bio card) */}
          <div className="bg-paper border-2 border-ink p-5 rounded flex gap-4 items-start my-8">
            <Link href="/author/gideon-ibitoye">
              <div className="w-12 h-12 bg-flag/10 border-2 border-flag text-flag rounded-full flex items-center justify-center font-display font-black text-xl shrink-0 hover:bg-flag hover:text-paper transition-colors cursor-pointer">
                GI
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h5 className="font-display font-black text-sm uppercase text-ink">
                  {article.author || "Gideon Ibitoye"}
                </h5>
                <span className="bg-flag text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Verified Editor</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {article.author || "Gideon Ibitoye"} is the Chief Editor and Reviewing Authority at Todaynews.ng, specializing in Nigerian political affairs, parallel currency trends, and national policy analysis.
              </p>
              <div className="mt-2 flex items-center gap-4 text-[10px] font-bold">
                <a href="mailto:editor@todaynews.ng" className="text-flag underline hover:text-ink">
                  editor@todaynews.ng
                </a>
                <Link href="/author/gideon-ibitoye" className="text-muted hover:text-flag">
                  View All Articles →
                </Link>
              </div>
            </div>
          </div>

          {/* Comments Feed Box Simulator */}
          <div className="border-t-2 border-ink/10 pt-6 mt-8">
            <h4 className="font-display font-black text-base uppercase text-ink mb-4 flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-flag" /> Comments ({Math.floor(article.views / 2500) + 1})
            </h4>
            <div className="space-y-4">
              <div className="border border-ink/10 p-3 rounded bg-paper/30 text-xs">
                <span className="font-extrabold text-ink block">Musa from Kaduna</span>
                <span className="text-[10px] text-muted font-bold block mb-1">2 hours ago</span>
                <p className="text-muted leading-relaxed">This is indeed a timely development. Many HND holders have struggled for years for parity in grades. Thank you Todaynews for the details.</p>
              </div>
              <div className="border border-ink/10 p-3 rounded bg-paper/30 text-xs">
                <span className="font-extrabold text-ink block">Chidi from Enugu</span>
                <span className="text-[10px] text-muted font-bold block mb-1">4 hours ago</span>
                <p className="text-muted leading-relaxed">Hope the conversion cost remains affordable. Good news overall.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-4">
          <TrendingSidebar />
          <WhatsAppBanner />
          <AdSlot id="sidebar-display-article" type="sidebar-native" />
        </div>
      </div>
    </div>
  );
}
