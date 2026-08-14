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
  if (/scholarship|grant|sponsor|study abroad|fellowship|masters degree|international student|tuition/i.test(text)) return "SCHOLARSHIP";
  if (/japa|visa|relocation|emigrate|work permit|green card|canada|uk|usa|abroad|diaspora|migration/i.test(text)) return "JAPA";
  if (/make money|passive income|side hustle|freelance|online job|work from home|earn online|cryptocurrency|drop shipping|affiliate/i.test(text)) return "MAKE_MONEY_ONLINE";

  return "POLITICS";
}

/**
 * Search for related image by topic using free image APIs.
 * Falls back to generic news image if search fails.
 */
async function findRelatedImage(topic: string): Promise<string | undefined> {
  try {
    // Try Unsplash API (free tier, no key required for basic searches)
    const searchTerm = topic.split(" ").slice(0, 3).join("+");
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=1&order_by=relevance`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        "User-Agent": "TodaynewsBot/1.0",
        "Accept-Version": "v1",
      },
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data.results?.[0]?.urls?.regular) {
        return data.results[0].urls.regular;
      }
    }

    // Fallback: Try Pixabay if available
    // For now, return undefined and let the article use a default placeholder
    return undefined;
  } catch (err) {
    console.error("[Image Search] Failed:", err);
    return undefined;
  }
}

/**
 * Calculate importance score for ranking news.
 * Higher score = more important / trending.
 */
function calculateImportanceScore(
  title: string,
  content: string,
  pubDate: string | undefined,
  engagement?: number
): number {
  let score = 0;

  // Recency: more recent = higher score
  if (pubDate) {
    const hoursOld = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 100 - hoursOld * 5); // Decreases 5 points per hour
  } else {
    score += 50;
  }

  // Length: longer articles = more comprehensive
  score += Math.min(30, content.length / 50);

  // Keywords: critical topics get boost
  const text = `${title} ${content}`.toLowerCase();
  if (/breaking|urgent|alert|emergency|disaster|crisis/i.test(text)) score += 25;
  if (/government|president|senate|minister|policy|announcement/i.test(text)) score += 15;
  if (/death|killed|murder|accident|fire|flood/i.test(text)) score += 20;
  if (/naira|economy|market|stock|inflation|unemployment/i.test(text)) score += 12;

  // Engagement multiplier (if available)
  if (engagement && engagement > 0) {
    score *= 1 + engagement / 100;
  }

  return score;
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

/**
 * Scrape web for scholarship opportunities.
 * Searches across various scholarship databases and websites.
 */
export async function scrapeScholarships(limit: number = 5): Promise<ScrapedStory[]> {
  const stories: ScrapedStory[] = [];
  
  // List of scholarship websites to check
  const scholarshipSources = [
    "https://www.chevening.org/",
    "https://www.britishcouncil.org/study-uk/scholarships",
    "https://www.fulbright.ng/",
    "https://www.mastercardfoundation.org/",
    "https://www.genderatwork.org/scholarships/",
  ];

  for (const url of scholarshipSources) {
    try {
      const story = await scrapeUrl(url);
      if (story && story.content.length > 100) {
        story.category = "SCHOLARSHIP";
        stories.push(story);
      }
    } catch (err) {
      console.error(`[Scholarship Scraper] Failed to scrape ${url}:`, err);
    }
  }

  // If we don't have enough, also try searching for keyword-based content
  if (stories.length < limit) {
    const searchKeywords = ["Nigerian scholarships 2024", "international scholarships for Nigerians", "fully funded masters programmes"];
    // In a real scenario, you'd use a search API here
    console.log("[Scholarship Scraper] Would search for:", searchKeywords);
  }

  return stories.slice(0, limit);
}

/**
 * Scrape web for Japa (relocation/visa) opportunities.
 * Searches for immigration, visa, and relocation information.
 */
export async function scrapeJapa(limit: number = 5): Promise<ScrapedStory[]> {
  const stories: ScrapedStory[] = [];

  // List of Japa-related sources
  const japaSources = [
    "https://www.gov.uk/government/organisations/uk-visas-and-immigration",
    "https://www.canada.ca/en/immigration-refugees-settlement.html",
    "https://www.uscis.gov/",
    "https://www.vfsglobal.com/en/",
    "https://relocate.me/blog",
  ];

  for (const url of japaSources) {
    try {
      const story = await scrapeUrl(url);
      if (story && story.content.length > 100) {
        story.category = "JAPA";
        stories.push(story);
      }
    } catch (err) {
      console.error(`[Japa Scraper] Failed to scrape ${url}:`, err);
    }
  }

  return stories.slice(0, limit);
}

/**
 * Scrape web for "Make Money Online" opportunities.
 * Searches for legitimate online earning methods.
 */
export async function scrapeMakeMoneyOnline(limit: number = 5): Promise<ScrapedStory[]> {
  const stories: ScrapedStory[] = [];

  // List of make money online sources (legitimate platforms)
  const moneyOnlineSources = [
    "https://www.fiverr.com/blog",
    "https://blog.upwork.com/",
    "https://www.freelancer.com/",
    "https://www.skillshare.com/",
    "https://www.medium.com/tag/making-money-online",
  ];

  for (const url of moneyOnlineSources) {
    try {
      const story = await scrapeUrl(url);
      if (story && story.content.length > 100) {
        story.category = "MAKE_MONEY_ONLINE";
        stories.push(story);
      }
    } catch (err) {
      console.error(`[Make Money Online Scraper] Failed to scrape ${url}:`, err);
    }
  }

  return stories.slice(0, limit);
}

/**
 * Enhance scraped stories with missing images and importance ranking.
 * Ensures every story has an image and is ranked by importance.
 */
export async function enrichAndRankStories(stories: ScrapedStory[]): Promise<ScrapedStory[]> {
  // Add missing images
  const enrichedStories = await Promise.all(
    stories.map(async (story) => {
      if (!story.imageUrl) {
        // Try to find a related image
        const foundImage = await findRelatedImage(story.title);
        return {
          ...story,
          imageUrl: foundImage || `/images/default-news-placeholder.jpg`, // Fallback to default
        };
      }
      return story;
    })
  );

  // Rank by importance score
  enrichedStories.sort((a, b) => {
    const scoreA = calculateImportanceScore(a.title, a.content, a.pubDate);
    const scoreB = calculateImportanceScore(b.title, b.content, b.pubDate);
    return scoreB - scoreA; // Descending order
  });

  return enrichedStories;
}

