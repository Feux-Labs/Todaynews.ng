import * as cheerio from "cheerio";
import RSSParser from "rss-parser";
import { isDbConfigured, prisma, memoryDb } from "./db";

export interface ScrapedStory {
  title: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  category: string;
  imageUrl?: string;
  /** Real outlet name for image attribution — kept separate from the
   * (deliberately Todaynews-branded) sourceName field above. */
  imageCredit?: string;
  pubDate?: string;
}

const rssParser = new RSSParser({
  timeout: 5000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; TodaynewsBot/1.0; +https://todaynews.ng)",
  },
});

const EDITORIAL_IMAGE_POOLS: Record<string, string[]> = {
  DEFAULT: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
  ],
  POLITICS: [
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  ],
  SECURITY: [
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1453873531674-215110116639?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
  ],
  NAIRA: [
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1565372195458-9de0b320ef04?auto=format&fit=crop&w=1200&q=80",
  ],
  METRO: [
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1200&q=80",
  ],
  TECHNOLOGY: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
  ],
  SPORTS: [
    "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
  ],
  ENTERTAINMENT: [
    "https://images.unsplash.com/photo-1516280440614-abea0f8c6b69?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80",
  ],
  EDUCATION: [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  ],
  HEALTH: [
    "https://images.unsplash.com/photo-1538108149393-fbbd81895977?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
  ],
  SCHOLARSHIP: [
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?auto=format&fit=crop&w=1200&q=80",
  ],
  JAPA: [
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80",
  ],
  MAKE_MONEY_ONLINE: [
    "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
  ],
};

// Fallback constant for backwards compatibility
const FALLBACK_IMAGE_BY_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(EDITORIAL_IMAGE_POOLS).map(([k, v]) => [k, v[0]])
);

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// RSS Feed sources — Nigerian/African outlets plus a real international spread,
// so coverage is never dependent on a single publisher (e.g. Punch NG).
const RSS_SOURCES: { name: string; url: string; category: string }[] = [
  // ── Nigeria / Africa ──────────────────────────────────────────────────────
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
  { name: "Africanews", url: "https://www.africanews.com/feed/rss", category: "POLITICS" },
  // ── World / International ─────────────────────────────────────────────────
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "POLITICS" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "POLITICS" },
  { name: "France24", url: "https://www.france24.com/en/rss", category: "POLITICS" },
  { name: "DW News", url: "https://rss.dw.com/rdf/rss-en-all", category: "POLITICS" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss", category: "POLITICS" },
  { name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "POLITICS" },
  { name: "Sky News World", url: "https://feeds.skynews.com/feeds/rss/world.xml", category: "POLITICS" },
  { name: "CNBC World", url: "https://www.cnbc.com/id/100727362/device/rss/rss.html", category: "NAIRA" },
];

/**
 * Free, keyless "search the whole web" mechanism via Google News' public RSS
 * search endpoint — indexes essentially any publisher Google crawls, not just
 * the fixed RSS_SOURCES list above. Used for on-demand topic sweeps (AI chat
 * search intent, cron topic rotation) that need broader reach than the fixed
 * source list.
 */
export async function searchGoogleNews(query: string, region: string = "NG"): Promise<ScrapedStory[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const encodedQuery = encodeURIComponent(trimmedQuery);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-${region}&gl=${region}&ceid=${region}:en`;

  try {
    const feed = await rssParser.parseURL(url);
    const items = feed.items.slice(0, 15);

    // NOTE: Google News' RSS feed never includes a real per-article image —
    // confirmed by inspecting raw item output, no thumbnail/media field
    // exists. Its article links are also a consent-walled redirect, not a
    // real one, so fetching them for an og:image just returns Google's own
    // interstitial page and a misleading generic image — tried this, reverted
    // it. Leaving imageUrl unset here is deliberate: resolveStoryImage falls
    // through cleanly to a real Wikipedia photo or stock instead of
    // crediting an image to a source that never actually provided it.
    const stories: ScrapedStory[] = items
      .filter((item) => item.title && item.link)
      .map((item) => {
        const pubDateStr = item.isoDate || item.pubDate || new Date().toISOString();
        const rawContent = item.contentSnippet || item.content || item.title || "";
        const cleanContent = stripCompetitorLinksAndBoilerplate(rawContent);
        // Google News titles are formatted "Headline - Source Name"; extract the real source.
        const sourceMatch = item.title!.match(/\s-\s([^-]+)$/);
        const cleanTitle = sourceMatch ? item.title!.replace(/\s-\s([^-]+)$/, "").trim() : item.title!;

        return {
          title: cleanTitle,
          content: cleanContent || cleanTitle,
          sourceUrl: item.link!,
          sourceName: "Todaynews AI",
          category: detectCategory(cleanTitle, cleanContent),
          pubDate: pubDateStr,
        };
      });

    return stories;
  } catch (err) {
    console.error(`[Google News Search] Query "${trimmedQuery}" failed:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

// Keyword-based category detection with precise word boundaries
export function detectCategory(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  // NAIRA & ECONOMY
  if (/\b(naira|dollar|cbn|forex|exchange rate|inflation|gdp|budget|crude oil|fuel price|petrol price|refinery|customs|revenue|bank|tax)\b/i.test(text)) return "NAIRA";
  
  // SPORTS
  if (/\b(super eagles|super falcons|npfl|football|soccer|afcon|premier league|champions league|nba|boxing|tennis|athletics|osimhen|boniface)\b/i.test(text)) return "SPORTS";
  
  // ENTERTAINMENT
  if (/\b(bbnaija|nollywood|davido|wizkid|burna|asake|tiwa|rema|afrobeats|actress|actor|celebrity|album|song|grammy|cinema|movie|concert)\b/i.test(text)) return "ENTERTAINMENT";
  
  // SECURITY, COURT, JUDICIARY, POLICE, CRIME
  if (/\b(court|judge|chief judge|justice|cj|inmate|prison|trial|efcc|dss|icpc|police|arrest|arrested|gunmen|kidnap|kidnappers|abduct|bandit|bandits|terror|terrorism|boko haram|iswap|robbery|killing|killed|murder|jail|bail|prosecution|qur'an|quran|desecration)\b/i.test(text)) return "SECURITY";
  
  // SCHOLARSHIPS
  if (/\b(scholarship|scholarships|fully funded|fellowship|grant|ptdf|chevening|study abroad|mastercard foundation|tuition)\b/i.test(text)) return "SCHOLARSHIP";
  
  // JAPA & IMMIGRATION
  if (/\b(japa|visa|visas|relocate|relocation|immigration|emigrate|work permit|green card|canada visa|uk visa|embassy|abroad)\b/i.test(text)) return "JAPA";
  
  // HEALTH & MEDICINE
  if (/\b(health|hospital|disease|covid|malaria|doctor|doctors|medical|cholera|lassa fever|ncdc|who|surgery|vaccine)\b/i.test(text)) return "HEALTH";
  
  // EDUCATION
  if (/\b(university|school|students|student|jamb|waec|neco|education|asuu|lecturer|polytechnic|campus|vc|matriculation)\b/i.test(text)) return "EDUCATION";
  
  // TECHNOLOGY & AI (with strict boundaries)
  if (/\b(artificial intelligence|ai startup|5g network|fintech|software engineering|cybersecurity|crypto|cryptocurrency|telecom|broadband)\b/i.test(text)) return "TECHNOLOGY";
  
  // MAKE MONEY ONLINE
  if (/\b(make money|side hustle|freelance|remote work|online income|passive income|affiliate marketing)\b/i.test(text)) return "MAKE_MONEY_ONLINE";
  
  // METRO & REGIONAL
  if (/\b(lagos|abuja|kano|rivers|ibadan|osun|benue|kebbi|traffic|road|accident|flood|fire|market|okada|danfo|residents|demolition)\b/i.test(text)) return "METRO";
  
  // POLITICS & GOVERNANCE
  if (/\b(tinubu|shettima|senate|house of reps|governor|adeleke|sanwo-olu|election|presidency|minister|apc|pdp|lp|nnpp|inec|bill|policy|petition|senator|accord)\b/i.test(text)) return "POLITICS";

  return "POLITICS";
}

// ============================================================
// DEDUPLICATION — "never repeat a news" enforcement
// ============================================================

const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "at", "to", "for", "and", "or", "with",
  "as", "by", "is", "are", "was", "were", "after", "before", "over", "amid",
  "amidst", "new", "says", "say", "said", "how", "why", "what", "who", "this",
  "that", "his", "her", "their", "its", "from", "into", "than", "then", "but",
]);

function normalizedTitleWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

/**
 * Jaccard similarity between two headlines' significant words (0..1).
 * Catches reworded rewrites of the same real-world event, not just exact
 * title matches — e.g. "Tinubu Signs New Tax Bill" vs "President Tinubu
 * Approves Tax Reform Bill" both describe the same story.
 */
export function titleSimilarity(a: string, b: string): number {
  const setA = normalizedTitleWords(a);
  const setB = normalizedTitleWords(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) if (setB.has(word)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const DUPLICATE_SIMILARITY_THRESHOLD = 0.6;

/** Fetch titles of recently created articles (DB or in-memory) for dedup comparison. */
export async function getRecentArticleTitles(days: number = 7): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  if (isDbConfigured()) {
    try {
      const rows = await prisma.article.findMany({
        where: { createdAt: { gte: since } },
        select: { title: true },
        take: 500,
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => r.title);
    } catch (err) {
      console.error("[Dedup] Failed to fetch recent titles from DB, falling back to memory:", err);
    }
  }

  const mem = await memoryDb.getArticles(undefined, undefined, 1, 500);
  return (mem.articles || []).map((a: any) => a.title as string);
}

/**
 * True if `title` is a near-duplicate of an existing recent article (fuzzy),
 * or of any title in `batchTitles` (other stories already picked in this run).
 */
export async function isDuplicateStory(
  title: string,
  options: { batchTitles?: string[]; existingTitles?: string[] } = {}
): Promise<boolean> {
  const existingTitles = options.existingTitles || (await getRecentArticleTitles());
  const batchTitles = options.batchTitles || [];

  for (const other of [...existingTitles, ...batchTitles]) {
    if (titleSimilarity(title, other) >= DUPLICATE_SIMILARITY_THRESHOLD) return true;
  }
  return false;
}

// ============================================================
// IMAGE RESOLUTION — real photos for named subjects, not mismatched stock
// ============================================================

const TITLE_STOPWORD_START = new Set([
  "The", "A", "An", "How", "Why", "What", "Who", "This", "That", "In", "On",
  "At", "For", "After", "Before", "With", "As", "Amid", "Breaking", "See",
  "Watch", "New", "Report", "Reports", "Exclusive",
]);

/**
 * Heuristically pull the likely main subject (a named person, or a specific
 * named entity) out of a headline — sequences of 2-3 capitalized words that
 * aren't a stopword-led phrase. Best-effort; used only to try fetching a real
 * photo, never blocks the pipeline if nothing is found.
 */
export function extractMainSubject(title: string): string | null {
  const matches = title.match(/\b([A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]+){1,2})\b/g);
  if (!matches || matches.length === 0) return null;

  const candidates = matches.filter((m) => {
    const firstWord = m.split(/\s+/)[0];
    if (TITLE_STOPWORD_START.has(firstWord)) return false;
    if (m === m.toUpperCase()) return false; // skip ALL-CAPS acronyms like "NNPC", "EFCC"
    return true;
  });

  if (candidates.length === 0) return null;
  // Prefer the longest (most specific) candidate.
  return candidates.sort((a, b) => b.length - a.length)[0];
}

const wikipediaPhotoCache = new Map<string, string | null>();

/** Free, keyless lookup of a real photo for a named person/entity via Wikipedia's REST summary API. */
export async function fetchPersonPhoto(name: string): Promise<string | null> {
  if (!name || name.length < 4) return null;
  if (wikipediaPhotoCache.has(name)) return wikipediaPhotoCache.get(name) || null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\s+/g, "_"))}`,
      { headers: { "User-Agent": "TodaynewsBot/1.0 (+https://todaynews.ng)" }, signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      wikipediaPhotoCache.set(name, null);
      return null;
    }

    const data: any = await res.json();
    if (data.type === "disambiguation") {
      wikipediaPhotoCache.set(name, null);
      return null;
    }

    const photo: string | null = data.originalimage?.source || data.thumbnail?.source || null;
    wikipediaPhotoCache.set(name, photo);
    return photo;
  } catch (err) {
    wikipediaPhotoCache.set(name, null);
    return null;
  }
}

export interface ResolvedImage {
  url: string;
  /** Human-readable attribution for the image's real origin. */
  credit: string;
}

/**
 * Resolve the most accurate image for a story, in strict priority order:
 *   1. The image actually published alongside the story at its source —
 *      always preferred, credited to that source, for real photo accuracy.
 *   2. Only if the source has no usable image: search elsewhere for a real
 *      photo of the story's named subject (Wikipedia).
 *   3. Only as a last-last-last resort: a generic category stock photo.
 */
export async function resolveStoryImage(
  imageUrl?: string,
  title?: string,
  category?: string,
  sourceName?: string
): Promise<ResolvedImage> {
  const cleanCandidate = (imageUrl || "").trim();
  const isGenericLogo = /logo|icon|favicon|placeholder|avatar|default-thumbnail|punch-logo|sprite|1x1|pixel/i.test(cleanCandidate);

  // 1. The source's own image — always preferred for accuracy.
  if (cleanCandidate && /^https?:\/\//i.test(cleanCandidate) && !isGenericLogo) {
    return {
      url: cleanCandidate,
      credit: sourceName && sourceName !== "Todaynews AI" ? sourceName : "Source publisher",
    };
  }

  // 2. No source image — search elsewhere for a real photo of the subject.
  if (title) {
    const subject = extractMainSubject(title);
    if (subject) {
      const personPhoto = await fetchPersonPhoto(subject);
      if (personPhoto) return { url: personPhoto, credit: "Wikipedia" };
    }
  }

  // 3. Last resort — generic category stock photo.
  const categoryKey = ((category || "").toUpperCase() || "DEFAULT") as string;
  const pool = EDITORIAL_IMAGE_POOLS[categoryKey] || EDITORIAL_IMAGE_POOLS.DEFAULT;

  const titleKey = (title || categoryKey || "todaynews-story").trim();
  const selectedImage = pool[hashString(titleKey) % pool.length];

  return { url: selectedImage, credit: "Unsplash (stock)" };
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

export function stripCompetitorLinksAndBoilerplate(text: string): string {
  if (!text) return "";
  return text
    // Remove "Read More: https://..." or "Read more at https://..." or "Continue reading on..."
    .replace(/\s*(?:read\s+more|continue\s+reading|click\s+here|full\s+story|read\s+full\s+article)(?:\s+at|\s+on|\s*:)?[^\n.]*(?:https?:\/\/[^\s)]+)?/gi, "")
    // Remove standalone URLs
    .replace(/https?:\/\/[^\s)]+/gi, "")
    // Remove "The post ... appeared first on ..."
    .replace(/\s*The post\s+.*?appeared first on\s+.*?(?:\.|$)/gi, "")
    // Remove copyright / attribution footers
    .replace(/\s*Copyright\s+.*?(?:Punch|Vanguard|Daily Trust|Guardian|Sahara Reporters|Premium Times|The Nation|Tribune|Sun|All rights reserved).*?(?:\.|$)/gi, "")
    // Remove trailing colons, dashes, or spaces left behind
    .replace(/\s*[-\u2013\u2014:]+\s*$/g, "")
    .trim();
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

        // Extract content & clean all competitor URLs
        const rawContent = item["content:encoded"] || item.content || item.contentSnippet || "";
        const $ = cheerio.load(rawContent);
        const cleanContent = stripCompetitorLinksAndBoilerplate($.text().trim());

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

        // Extract image from RSS item tags or HTML
        let imageUrl: string | undefined = undefined;
        if ((item as any).enclosure?.url) {
          imageUrl = (item as any).enclosure.url;
        } else if ((item as any)["media:content"]?.url) {
          imageUrl = (item as any)["media:content"].url;
        } else if ((item as any)["media:content"]?.$?.url) {
          imageUrl = (item as any)["media:content"].$.url;
        } else if ((item as any)["media:thumbnail"]?.url) {
          imageUrl = (item as any)["media:thumbnail"].url;
        } else if ((item as any)["media:thumbnail"]?.$?.url) {
          imageUrl = (item as any)["media:thumbnail"].$.url;
        }

        if (!imageUrl) {
          const imgMatch =
            rawContent.match(/<img[^>]+src=["']([^"']+)["']/i) ||
            (item.content || "").match(/<img[^>]+src=["']([^"']+)["']/i) ||
            (item.summary || "").match(/<img[^>]+src=["']([^"']+)["']/i);
          imageUrl = imgMatch ? imgMatch[1] : undefined;
        }

        const category = detectCategory(item.title, cleanContent);

        if (cleanContent.length > 50 || item.title) {
          stories.push({
            title: item.title,
            content: cleanContent || item.title,
            sourceUrl: item.link,
            sourceName: "Todaynews AI",
            category,
            // Leave unresolved if the source had no image — resolveStoryImage
            // handles the full source → Wikipedia → stock priority chain later,
            // with correct attribution. Falling back to stock here would get
            // mislabeled as a "sourced" image downstream.
            imageUrl,
            imageCredit: imageUrl ? source.name : undefined,
            pubDate: pubDateStr || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error(`[RSS Scraper] Feed ${source.name} failed:`, err instanceof Error ? err.message : String(err));
    }
  });

  await Promise.allSettled(feedPromises);

  // A "source" image that's identical across multiple different stories is a
  // site-wide default/template image (common with WordPress/Yoast setups),
  // not a real per-article photo — strip it so resolveStoryImage falls
  // through to Wikipedia/stock instead of trusting a fake match.
  const imageUrlCounts = new Map<string, number>();
  for (const s of stories) {
    if (s.imageUrl) imageUrlCounts.set(s.imageUrl, (imageUrlCounts.get(s.imageUrl) || 0) + 1);
  }
  for (const s of stories) {
    if (s.imageUrl && (imageUrlCounts.get(s.imageUrl) || 0) > 1) {
      s.imageUrl = undefined;
      s.imageCredit = undefined;
    }
  }

  // Deduplicate by fuzzy title similarity (catches reworded rewrites of the
  // same story across different outlets, not just exact/prefix matches).
  const keptTitles: string[] = [];
  const unique = stories.filter((s) => {
    const isDup = keptTitles.some((t) => titleSimilarity(s.title, t) >= DUPLICATE_SIMILARITY_THRESHOLD);
    if (isDup) return false;
    keptTitles.push(s.title);
    return true;
  });

  // Sort by published date descending
  unique.sort((a, b) => {
    const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return timeB - timeA;
  });

  const selected = unique.slice(0, limit);

  // Guarantee every story has a valid high-res image, correctly attributed
  const resolvedStories = await Promise.all(
    selected.map(async (story) => {
      const resolved = await resolveStoryImage(story.imageUrl, story.title, story.category, story.imageCredit);
      return {
        ...story,
        imageUrl: resolved.url,
        imageCredit: resolved.credit,
      };
    })
  );

  return resolvedStories;
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
      sourceName: "Todaynews AI",
      category: detectCategory(title, content),
      imageUrl,
      imageCredit: imageUrl ? sourceName : undefined,
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
  // Add missing images, correctly attributed
  const enrichedStories = await Promise.all(
    stories.map(async (story) => {
      if (!story.imageUrl) {
        const resolved = await resolveStoryImage(story.imageUrl, story.title, story.category, story.imageCredit);
        return {
          ...story,
          imageUrl: resolved.url,
          imageCredit: resolved.credit,
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

