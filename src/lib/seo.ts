import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng";

export function getBaseUrl() {
  return SITE_URL;
}

export function generateSeoMetadata({
  title,
  description,
  path = "",
  imageUrl = "/images/og-default.jpg",
  category,
  keywords = [],
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  imageUrl?: string;
  category?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;

  const defaultKeywords = [
    "Todaynews.ng",
    "Nigerian news",
    "breaking news Nigeria",
    "politics",
    "naira watch",
    "Naira rates parallel market",
    "CBN exchange rates",
    "BBNaija updates",
    "Nollywood entertainment",
    "Super Eagles sports",
    "security news Nigeria",
  ];

  const metaKeywords = Array.from(new Set([...defaultKeywords, ...keywords]));

  return {
    title: `${title} | Todaynews.ng`,
    description,
    keywords: metaKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      title: `${title} | Todaynews.ng`,
      description,
      url: canonicalUrl,
      siteName: "Todaynews.ng",
      locale: "en_NG",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Todaynews.ng`,
      description,
      images: [imageUrl],
      creator: "@todaynews_ng",
    },
  };
}

export function getNewsArticleJsonLd({
  headline,
  description,
  imageUrl,
  datePublished,
  dateModified,
  authorName = "TodaynewsAi",
  slug,
  category,
}: {
  headline: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified: string;
  authorName?: string;
  slug: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/article/${slug}`,
    },
    "headline": headline,
    "description": description,
    "image": [imageUrl],
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "isAccessibleForFree": true,
    "inLanguage": "en-NG",
    "articleSection": category,
    "author": {
      "@type": "Organization",
      "name": authorName || "TodaynewsAi",
      "jobTitle": "AI Editorial System",
      "url": `${SITE_URL}/author/todaynewsai`,
    },
    "publisher": {
      "@type": "NewsMediaOrganization",
      "name": "Todaynews.ng",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/images/logo-publisher.png`,
      },
    },
  };
}

export function getBreadcrumbsJsonLd(
  items: { name: string; item: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${SITE_URL}${item.item}`,
    })),
  };
}
