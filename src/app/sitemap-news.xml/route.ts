import { NextResponse } from "next/server";
import { memoryDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GOOGLE NEWS SITEMAP GENERATOR
 * Spec: https://support.google.com/news/publisher-center/answer/74288
 * Contains only articles published within the last 48 hours.
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";
  const { articles: publishedArticles } = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 100);

  // Filter for articles published within the last 48 hours (or fall back to recent top 50)
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentArticles = publishedArticles.filter((article: any) => {
    const pubDate = new Date(article.createdAt);
    return pubDate >= fortyEightHoursAgo;
  });

  const targetArticles = recentArticles.length > 0 ? recentArticles : publishedArticles.slice(0, 50);

  const xmlItems = targetArticles
    .map((article: any) => {
      const pubDate = new Date(article.createdAt).toISOString();
      const cleanTitle = article.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

      return `
    <url>
      <loc>${baseUrl}/article/${article.slug}</loc>
      <news:news>
        <news:publication>
          <news:name>Todaynews.ng</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:publication_date>${pubDate}</news:publication_date>
        <news:title>${cleanTitle}</news:title>
      </news:news>
    </url>`;
    })
    .join("");

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${xmlItems}
</urlset>`;

  return new NextResponse(xmlContent, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
    },
  });
}
