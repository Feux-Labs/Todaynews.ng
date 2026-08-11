import { MetadataRoute } from "next";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";
  const routes = ["", "/category/politics", "/category/naira", "/category/entertainment", "/category/sports", "/category/security"];

  const sitemaps: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${baseUrl}${r}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: r === "" ? 1.0 : 0.8,
  }));

  try {
    let articles: any[] = [];
    if (isDbConfigured()) {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      });
    } else {
      articles = await memoryDb.getArticles(undefined, "PUBLISHED");
    }

    const articleSitemaps: MetadataRoute.Sitemap = articles.map((art: any) => ({
      url: `${baseUrl}/article/${art.slug}`,
      lastModified: art.updatedAt ? new Date(art.updatedAt) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    sitemaps.push(...articleSitemaps);
  } catch (e) {
    console.error("Failed to query sitemap index:", e);
  }

  return sitemaps;
}
