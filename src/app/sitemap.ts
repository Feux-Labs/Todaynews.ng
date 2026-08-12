import { MetadataRoute } from "next";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";
  const staticRoutes = [
    "",
    "/about",
    "/editorial-standards",
    "/contact",
    "/author/gideon-ibitoye",
    "/category/politics",
    "/category/naira",
    "/category/entertainment",
    "/category/sports",
    "/category/security",
    "/category/metro",
    "/category/education",
    "/category/technology",
    "/category/health",
  ];

  const sitemaps: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${baseUrl}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "hourly" : "daily",
    priority: r === "" ? 1.0 : 0.8,
  }));

  let articles: any[] = [];

  if (isDbConfigured()) {
    try {
      articles = await prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      });
    } catch (e) {
      console.error("Failed to query sitemap articles from DB; using memory fallback:", e);
    }
  }

  if (articles.length === 0) {
    const res = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 100);
    articles = res.articles || (res as any);
  }

  try {
    const articleSitemaps: MetadataRoute.Sitemap = articles.map((art: any) => ({
      url: `${baseUrl}/article/${art.slug}`,
      lastModified: art.updatedAt ? new Date(art.updatedAt) : new Date(),
      changeFrequency: "hourly",
      priority: 0.7,
    }));

    sitemaps.push(...articleSitemaps);
  } catch (e) {
    console.error("Failed to query sitemap index:", e);
  }

  return sitemaps;
}
