import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api/",
        "/search", // Disallow search result pages to prevent indexing of junk search loops
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
