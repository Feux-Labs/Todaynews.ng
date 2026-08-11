import * as cheerio from "cheerio";
import RSSParser from "rss-parser";

export interface ScrapedStory {
  title: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  category: string;
  imageUrl?: string;
  pubDate?: string;
}

const rssParser = new RSSParser();

// RSS Feed sources — Nigerian news sites with active RSS feeds
const RSS_SOURCES: { name: string; url: string; category: string }[] = [
  { name: "Punch NG", url: "https://punchng.com/feed/", category: "POLITICS" },
  { name: "Vanguard", url: "https://www.vanguardngr.com/feed/", category: "POLITICS" },
  { name: "Channels TV", url: "https://www.channelstv.com/feed/", category: "POLITICS" },
  { name: "Guardian Nigeria", url: "https://guardian.ng/feed/", category: "POLITICS" },
  { name: "Sahara Reporters", url: "https://saharareporters.com/articles/rss", category: "SECURITY" },
  { name: "Daily Trust", url: "https://dailytrust.com/feed/", category: "POLITICS" },
  { name: "BBC Africa", url: "https://feeds.bbci.co.uk/news/world/africa/rss.xml", category: "POLITICS" },
  { name: "Premium Times", url: "https://www.premiumtimesng.com/feed", category: "POLITICS" },
  { name: "The Nation", url: "https://thenationonlineng.net/feed/", category: "POLITICS" },
  { name: "Tribune", url: "https://tribuneonlineng.com/feed/", category: "POLITICS" },
  { name: "Daily Sun", url: "https://www.sunnewsonline.com/feed/", category: "METRO" },
  { name: "CNN Africa", url: "https://rss.cnn.com/rss/edition_africa.rss", category: "POLITICS" },
];

// Keyword-based category detection
function detectCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  if (/naira|dollar|cbn|forex|exchange rate|inflation|gdp|budget/i.test(text)) return "NAIRA";
  if (/super eagles|npfl|football|afcon|premier league|champions league|nba|boxing|tennis|athletics/i.test(text)) return "SPORTS";
  if (/bbnaija|nollywood|davido|wizkid|burna|music|concert|award|movie|celebrity/i.test(text)) return "ENTERTAINMENT";
  if (/boko haram|bandit|kidnap|insecurity|police|army|military|terrorism|iswap|robbery/i.test(text)) return "SECURITY";
  if (/lagos|traffic|road|accident|flood|fire|market|okada|danfo/i.test(text)) return "METRO";
  if (/university|school|jamb|waec|neco|student|education|asuu|lecture/i.test(text)) return "EDUCATION";
  if (/tech|ai|startup|5g|app|digital|ecommerce|fintech|crypto/i.test(text)) return "TECHNOLOGY";
  if (/health|hospital|malaria|covid|doctor|who|disease|ebola|cholera/i.test(text)) return "HEALTH";

  return "POLITICS";
}

/**
 * Scrape RSS feeds from configured Nigerian news sources.
 * Supports filtering by keyword query and published duration (in minutes).
 */
export async function scrapeRSSFeeds(
  limit: number = 5,
  query?: string,
  minutesFilter?: number
): Promise<ScrapedStory[]> {
  const stories: ScrapedStory[] = [];
  const cutoffTime = minutesFilter ? Date.now() - minutesFilter * 60 * 1000 : null;
  const lowercaseQuery = query?.toLowerCase().trim() || "";

  const feedPromises = RSS_SOURCES.map(async (source) => {
    try {
      const feed = await rssParser.parseURL(source.url);
      const items = feed.items.slice(0, 10); // Look at top 10 per source for better filtering matching

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const pubDateStr = item.isoDate || item.pubDate || "";
        const pubTime = pubDateStr ? new Date(pubDateStr).getTime() : Date.now();

        // 1. Time range filter (e.g., last 30 minutes for cron scraper)
        if (cutoffTime && pubTime < cutoffTime) continue;

        // Extract content
        const rawContent = item["content:encoded"] || item.content || item.contentSnippet || "";
        const $ = cheerio.load(rawContent);
        const cleanContent = $.text().trim();

        // 2. Keyword query filter (supports multi-term searches like "terror business education")
        if (lowercaseQuery) {
          const matchText = `${item.title} ${cleanContent}`.toLowerCase();
          const detectedCat = detectCategory(item.title, cleanContent).toLowerCase();
          const queryWords = lowercaseQuery.split(/\s+/).filter((w) => w.length > 2);

          if (queryWords.length > 0) {
            const matchesAnyWord = queryWords.some(
              (word) => matchText.includes(word) || detectedCat.includes(word)
            );
            if (!matchesAnyWord) continue;
          } else if (!matchText.includes(lowercaseQuery) && !detectedCat.includes(lowercaseQuery)) {
            continue;
          }
        }

        const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/);
        const imageUrl = imgMatch ? imgMatch[1] : undefined;

        if (cleanContent.length > 50 || item.title) {
          stories.push({
            title: item.title,
            content: cleanContent || item.title,
            sourceUrl: item.link,
            sourceName: source.name,
            category: detectCategory(item.title, cleanContent),
            imageUrl,
            pubDate: pubDateStr || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      // Suppress normal network timeout logs
    }
  });

  await Promise.allSettled(feedPromises);

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const unique = stories.filter((s) => {
    const key = s.title.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by published date descending
  unique.sort((a, b) => {
    const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return timeB - timeA;
  });

  return unique.slice(0, limit);
}

/**
 * Scrape a specific URL for its article content.
 * Used when admin pastes a URL in the AI chat.
 */
export async function scrapeUrl(url: string): Promise<ScrapedStory | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TodaynewsBot/1.0)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Common news article selectors
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim();

    // Try multiple content selectors
    let content = "";
    const selectors = [
      "article .entry-content",
      ".post-content",
      ".article-content",
      ".story-body",
      "article p",
      ".entry-content p",
      "main p",
    ];

    for (const sel of selectors) {
      const paragraphs = $(sel);
      if (paragraphs.length > 0) {
        content = paragraphs.map((_, el) => $(el).text().trim()).get().join("\n\n");
        if (content.length > 100) break;
      }
    }

    if (!content || content.length < 50) {
      // Fallback: grab all <p> tags
      content = $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter((p) => p.length > 20)
        .slice(0, 15)
        .join("\n\n");
    }

    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $("article img").first().attr("src") ||
      undefined;

    const sourceName = new URL(url).hostname.replace("www.", "");

    return {
      title: title || "Untitled Article",
      content,
      sourceUrl: url,
      sourceName,
      category: detectCategory(title, content),
      imageUrl,
    };
  } catch (err) {
    console.error("[Scraper] URL scrape failed:", err);
    return null;
  }
}
