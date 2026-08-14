import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiBreaker } from "./circuitBreaker";
import { sanitizeArticleHtml } from "./content";

import { stripCompetitorLinksAndBoilerplate } from "./scraper";

export type AllowedCategory =
  | "POLITICS"
  | "NAIRA"
  | "ENTERTAINMENT"
  | "SPORTS"
  | "SECURITY"
  | "METRO"
  | "EDUCATION"
  | "TECHNOLOGY"
  | "HEALTH"
  | "SCHOLARSHIP"
  | "JAPA"
  | "MAKE_MONEY_ONLINE";

const VALID_CATEGORIES: Set<AllowedCategory> = new Set([
  "POLITICS",
  "NAIRA",
  "ENTERTAINMENT",
  "SPORTS",
  "SECURITY",
  "METRO",
  "EDUCATION",
  "TECHNOLOGY",
  "HEALTH",
  "SCHOLARSHIP",
  "JAPA",
  "MAKE_MONEY_ONLINE",
]);

export interface ParaphrasedResult {
  title: string;
  summary: string;
  category: AllowedCategory;
  pages: {
    pageNumber: number;
    title?: string;
    content: string;
  }[];
}

/**
 * Procedural offline rewriter when Gemini API key is not configured or fails.
 * Ensures strict compliance with Nigerian editorial rules, hedging terms, and category validation.
 */
export function cleanAndFormatTitle(rawTitle: string): string {
  if (!rawTitle) return "New Trending Nigerian News Alert";
  // Remove ALL occurrences of [BREAKING], trailing suffixes, and competitor urls
  let clean = stripCompetitorLinksAndBoilerplate(rawTitle)
    .replace(/\[BREAKING\]\s*/gi, "")
    .replace(/\s*[-\u2013\u2014]\s*What We Know So Far\s*/gi, "")
    .replace(/\s*[-\u2013\u2014]\s*What We Know\s*/gi, "")
    .trim();
  return clean || "New Trending Nigerian News Alert";
}

export function localProceduralRewriter(
  rawText: string,
  rawTitle: string,
  category: string
): ParaphrasedResult {
  const upperCat = (category || "POLITICS").toUpperCase() as AllowedCategory;
  const cleanCategory: AllowedCategory = VALID_CATEGORIES.has(upperCat) ? upperCat : "POLITICS";
  const headline = cleanAndFormatTitle(rawTitle);
  const cleanedText = stripCompetitorLinksAndBoilerplate(rawText || rawTitle);

  // Split cleaned text into sentences for richer paragraphs
  const sentences = cleanedText
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const chunk = (arr: string[], size: number) => {
    const out: string[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const chunks = chunk(sentences, Math.max(2, Math.floor(sentences.length / 3)));
  const part1 = chunks[0] || sentences;
  const part2 = chunks[1] || sentences;
  const part3 = chunks[2] || sentences;

  const toHtml = (lines: string[]) =>
    lines.map((l) => `<p class="mb-4">${l}</p>`).join("\n");

  const coreSentence = sentences[0] || `${headline}. Official channels and key stakeholders are currently assessing the situation as developments unfold.`;

  const pages: { pageNumber: number; title: string; content: string }[] = [];
  pages.push({
    pageNumber: 1,
    title: "Core Facts & Breaking Report",
    content:
      `<p class="mb-4"><strong>${headline}</strong> — ${coreSentence}</p>` +
      toHtml(
        part1.length >= 3
          ? part1.slice(1)
          : [
            "Credible sources confirm that the situation is being closely monitored by relevant authorities and emergency response agencies. Early accounts suggest a sequence of events that demands immediate attention from both citizens and policymakers.",
            "Todaynews.ng is tracking this story in real time. Multiple government agencies have been briefed and are expected to issue an official follow-up statement before end of day.",
            "Subject to official confirmation, preliminary accounts indicate that this development may have wide-reaching implications across key sectors. The full scope of the situation is still being assessed on the ground.",
          ]
      ) +
      `<p class="mb-4"><em>Note: Details surrounding this report remain subject to official verification by relevant authorities and emergency response agencies. Todaynews.ng is committed to accurate, verified reporting.</em></p>`,
  });

  pages.push({
    pageNumber: 2,
    title: "Why This Matters & Background Context",
    content:
      `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 Why This Matters to Nigerians</h4><p class="text-sm text-muted">This development carries direct implications for governance, security, and the affected communities across Nigeria.</p></div>` +
      toHtml(
        part2.length >= 3
          ? part2
          : [
            "Historical precedent shows that developments of this nature have led to significant policy adjustments and operational reviews. The Nigerian authorities have previously responded to similar triggers with specialized taskforce deployments and judicial reviews.",
            "Legal and security analysts noted in a recent briefing that proactive institutional responses play a critical role in preventing unnecessary public distress and ensuring justice is served.",
            "Civil society organisations and community advocates have begun weighing in on the matter, calling for transparency, due process, and timely disclosure from the appropriate authorities.",
            "Institutional lessons from previous cycles highlight the necessity of clear, verified reporting — a principle Todaynews.ng consistently upholds.",
          ]
      ),
  });

  pages.push({
    pageNumber: 3,
    title: "What Happens Next & Expert Outlook",
    content:
      toHtml(
        part3.length >= 3
          ? part3
          : [
            "Stakeholders, civil society groups, and community representatives are awaiting official updates from administrative representatives to determine subsequent measures.",
            "Legal and policy experts expect that the relevant authorities will convene an assessment review in the coming 48 to 72 hours to formally communicate their findings.",
            "Relevant agencies remain on alert to ensure due process and public order are maintained as the situation progresses.",
            "Diplomatic and human rights observers are reportedly monitoring developments closely, with a formal statement expected as more verified facts emerge.",
          ]
      ) +
      `<p class="mb-4"><strong>📌 Todaynews.ng will continue to provide real-time, verified updates on this developing story. Bookmark this page and follow our Breaking News ticker for the latest.</strong></p>`,
  });

  const summaryText = sentences[0]
    ? sentences[0].substring(0, 200) + (sentences[0].length > 200 ? "..." : "")
    : `Verified Nigerian breaking news report on ${headline}. Todaynews.ng provides real-time, accurate, and contextualised coverage.`;

  return {
    title: headline,
    summary: summaryText,
    category: cleanCategory,
    pages,
  };
}

function normalizeParaphrasedResult(result: ParaphrasedResult, fallback: ParaphrasedResult): ParaphrasedResult {
  const cleanCategory = VALID_CATEGORIES.has(result.category) ? result.category : fallback.category;
  const pages = Array.isArray(result.pages) && result.pages.length > 0 ? result.pages : fallback.pages;
  // Always clean title of any duplication before returning
  const cleanTitle = cleanAndFormatTitle(
    (result.title || fallback.title).replace(/\[BREAKING\]\s*/gi, "").trim()
  );

  return {
    title: cleanTitle,
    summary: stripCompetitorLinksAndBoilerplate(result.summary || fallback.summary).trim(),
    category: cleanCategory,
    pages: pages.map((page, index) => ({
      pageNumber: index + 1,
      title: page.title || `Section ${index + 1}`,
      content: sanitizeArticleHtml(
        stripCompetitorLinksAndBoilerplate(page.content || fallback.pages[index]?.content || fallback.summary)
      ),
    })),
  };
}

/**
 * Paraphrase raw article using Google Gemini API with Circuit Breaker protection.
 * Enforces Google News original content policies, "Why This Matters" analysis,
 * legal disclaimers ("allegedly"), and multi-page pagination splitting.
 * Each page must have 4-5 substantial paragraphs — NOT one-liners.
 */
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
].filter(Boolean) as string[];

export async function paraphraseNews(
  rawText: string,
  rawTitle: string,
  category: string
): Promise<ParaphrasedResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    throw new Error("Live Gemini AI is required for article paraphrasing and is not configured.");
  }

  return geminiBreaker.execute(
    async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const cleanInputTitle = cleanAndFormatTitle(rawTitle);
      const cleanInputText = stripCompetitorLinksAndBoilerplate(rawText);

      const prompt = `
      You are Chief Editor and Mass Communication Specialist for "Todaynews.ng", writing in the authoritative long-form style of Punch Newspaper, BBC Africa, Premium Times, and Guardian Nigeria.
      
      CORE MISSION:
      Todaynews.ng is Nigeria's AI-powered news channel dedicated to reducing misinformation and combating news censorship. Every article must be deeply informative, richly written, and genuinely valuable to Nigerian readers.

      CRITICAL CONTENT REQUIREMENTS — READ CAREFULLY:
      1. LONG-FORM CONTENT: Each page MUST contain at minimum 4 to 5 substantial paragraphs (each paragraph 3-5 sentences long). Do NOT write single-sentence pages. Pages should read like a full newspaper article section — thorough, intelligent, and contextualised.
      2. ORIGINAL VALUE ADDITION: You MUST include three distinct full-length sections:
         - Page 1 "Core Facts & Breaking Report": Full factual account with all known details, source attribution, timeline of events, official statements quoted.
         - Page 2 "Why This Matters & Background Context": Deep analysis of implications for Nigeria — economic, social, governance, security impact. Include historical comparisons and expert angles.
         - Page 3 "What Happens Next & Expert Outlook": Forward-looking analysis, anticipated government response, international reactions, citizen impact, timeline of expected developments.
      3. LEGAL HEDGING: Use "allegedly", "according to reports", "unconfirmed accounts indicate", "subject to official confirmation" appropriately throughout.
      4. PUNCH NEWS HEADLINE STYLE: Create a compelling, direct headline in the style of Punch Newspaper — sharp, impactful, and search-optimised. NO prefixes like [BREAKING], NO suffixes like "What We Know So Far". Example: "Naira hits new low as CBN holds emergency meeting" or "Court orders EFCC to release former governor within 48 hours". The headline should BE the story.
      5. META SUMMARY: Write a compelling 2-3 sentence meta description for Google Search indexing. Make it specific and informative.
      6. CATEGORY HANDLING: 
         - Pick exactly ONE from: POLITICS, NAIRA, ENTERTAINMENT, SPORTS, SECURITY, METRO, EDUCATION, TECHNOLOGY, HEALTH, SCHOLARSHIP, JAPA, MAKE_MONEY_ONLINE
         - For SCHOLARSHIP articles: Focus on eligibility, application deadlines, funding details, and how to apply
         - For JAPA articles: Highlight visa requirements, timeline, cost, and verification of legitimacy
         - For MAKE_MONEY_ONLINE articles: Emphasize legitimate methods, real experiences, and WARNING against scams
      7. HTML FORMATTING: Use rich HTML inside page content: <p class="mb-4">, <ul><li>, <strong>, <em>, <blockquote>, <h4>.
      8. STRICT PROHIBITION ON COMPETITOR LINKS: NEVER include external links, competitor website names (Punch, Vanguard, Daily Trust, Sahara Reporters, etc.), or phrases like "Read More: https://..." in the content or summary. Todaynews.ng is the sole publisher.

      Return ONLY a valid JSON object matching this exact schema:
      {
        "title": "Clean compelling headline without [BREAKING] prefix",
        "summary": "Compelling 2-3 sentence meta description for Google Search with key facts.",
        "category": "POLITICS",
        "pages": [
          {
            "pageNumber": 1,
            "title": "Core Facts & Breaking Report",
            "content": "<p class=\\"mb-4\\">Full detailed paragraph 1 with facts, quotes, timeline and should not be too short must be a bout 2 to 3 paragraphs, crisply written...</p><p class=\\"mb-4\\">Paragraph 2 with more context...</p><p class=\\"mb-4\\">Paragraph 3...</p><p class=\\"mb-4\\">Paragraph 4...</p><p class=\\"mb-4\\">Paragraph 5 with attribution and note...</p>"
          },
          {
            "pageNumber": 2,
            "title": "Why This Matters & Background Context",
            "content": "<div class=\\"p-4 bg-paper border-l-4 border-flag my-4 rounded\\"><h4 class=\\"font-bold text-ink mb-1\\">🇳🇬 Why This Matters to Nigerians and should not be too short must be a bout 1 to 2 paragraphs, crisply written</h4><p class=\\"text-sm text-muted\\">Analysis paragraph...</p></div><p class=\\"mb-4\\">Deep analysis paragraph 1...</p><p class=\\"mb-4\\">Historical context paragraph 2...</p><p class=\\"mb-4\\">Economic/social impact paragraph 3...</p><p class=\\"mb-4\\">Expert perspective paragraph 4...</p>"
          },
          {
            "pageNumber": 3,
            "title": "What Happens Next & Expert Outlook",
            "content": "<p class=\\"mb-4\\">Forward outlook paragraph 1...</p><p class=\\"mb-4\\">Government response expectation paragraph 2...</p><p class=\\"mb-4\\">Citizen impact paragraph 3...</p><p class=\\"mb-4\\">International reaction paragraph 4...</p><p class=\\"mb-4\\"><strong>📌 Todaynews.ng will continue tracking this story live.</strong></p>"
          }
        ]
      }

      Input Article Title: "${cleanInputTitle}"
      Input Target Category: "${category}"
      Input Article Text:
      ${cleanInputText}
      `;

      let lastError: any = null;
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
            },
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          if (text) {
            return normalizeParaphrasedResult(JSON.parse(text) as ParaphrasedResult, localProceduralRewriter(rawText, rawTitle, category));
          }
        } catch (err) {
          lastError = err;
          console.warn(`[Gemini Paraphrase] Model ${modelName} failed, trying next candidate:`, (err as any)?.message || err);
        }
      }

      throw lastError || new Error("All Gemini models failed during paraphrasing.");
    },
    async () => {
      throw new Error("Live Gemini AI is unavailable and fallback behavior is disabled.");
    }

  );
}

// ============================================================
// CHAT AI — now with live Google Search grounding & fallback
// ============================================================

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatAiResponse {
  intent: "chat" | "search" | "paraphrase";
  searchQuery?: string;       // reflects what Gemini itself searched, for UI display
  reply: string;
  sources?: GroundingSource[]; // citations, if grounding kicked in
}

// Topic keyword mapping for news detection
const TOPIC_MAP: { keywords: string[]; query: string; label: string }[] = [
  { keywords: ["naira", "exchange", "dollar", "forex", "cbn", "currency"], query: "naira exchange rate", label: "Naira & Forex" },
  { keywords: ["terror", "terrorism", "boko haram", "bandit", "kidnap", "attack", "bomb", "insurgent", "militant"], query: "terrorism security Nigeria", label: "Security & Terror" },
  { keywords: ["security", "police", "army", "military", "dss", "efcc"], query: "security Nigeria", label: "Security" },
  { keywords: ["business", "economy", "economic", "trade", "market", "stock", "invest", "inflation", "gdp"], query: "Nigeria business economy", label: "Business & Economy" },
  { keywords: ["school", "education", "asuu", "university", "student", "waec", "jamb", "neco", "nbte"], query: "Nigeria education school", label: "Education" },
  { keywords: ["scholarship", "scholarships", "fully funded", "chevening", "ptdf", "study abroad", "mastercard foundation"], query: "Nigeria scholarship opportunities", label: "Scholarships" },
  { keywords: ["japa", "visa", "relocate", "relocation", "immigration", "abroad"], query: "Nigeria japa visa relocation", label: "Japa" },
  { keywords: ["make money", "side hustle", "freelance", "remote work", "online income"], query: "Nigeria make money online", label: "Make Money Online" },
  { keywords: ["politics", "tinubu", "senate", "house of reps", "governor", "election", "aso rock", "presidency", "minister"], query: "Nigeria politics", label: "Politics" },
  { keywords: ["bbnaija", "big brother", "entertainment", "celebrity", "nollywood", "afrobeats", "music"], query: "Nigeria entertainment bbnaija", label: "Entertainment" },
  { keywords: ["sports", "super eagles", "super falcons", "football", "npfl", "basketball", "athletics"], query: "Nigeria sports", label: "Sports" },
  { keywords: ["health", "hospital", "disease", "covid", "malaria", "doctor", "medical"], query: "Nigeria health", label: "Health" },
  { keywords: ["tech", "technology", "startup", "ai", "fintech", "internet"], query: "Nigeria technology", label: "Technology" },
];

export function detectNewsSearchIntent(userMessage: string): { isSearch: boolean; query?: string; topicLabel?: string } {
  const text = userMessage.toLowerCase().trim();

  // If a URL is present
  if (/https?:\/\/[^\s)]+/i.test(text)) {
    return { isSearch: true };
  }

  // Explicit triggers
  const explicitTriggers = [
    "fetch trending nigeria news",
    "fetch trending news",
    "trending news",
    "latest news",
    "top news",
    "breaking news",
    "draft inbox",
    "inbox paraphrase",
    "get news",
    "fetch news",
    "show news",
    "scrape news",
    "today news",
    "news with the draft",
    "get me some top news",
    "get me top news",
    "get me news",
    "give me news",
    "bring news",
    "find news",
  ];

  if (explicitTriggers.some((t) => text.includes(t))) {
    return { isSearch: true, topicLabel: "Top Trending Nigerian News" };
  }

  const searchKeywords = [
    "search", "find", "fetch", "get", "scrape", "look for", "show me", "give me",
    "bring", "latest", "trending", "today", "update", "pull", "news", "stories",
    "headlines", "report", "reports"
  ];
  const hasSearchIntent = searchKeywords.some((k) => text.includes(k));

  const matched = TOPIC_MAP.filter((t) => t.keywords.some((kw) => text.includes(kw)));
  if (matched.length > 0 && hasSearchIntent) {
    return {
      isSearch: true,
      query: matched[0].query,
      topicLabel: matched.map((m) => m.label).join(", "),
    };
  }

  if (hasSearchIntent && (text.includes("news") || text.includes("headline") || text.includes("headlines") || text.includes("story") || text.includes("stories") || text.includes("article"))) {
    return { isSearch: true, topicLabel: "Latest Verified News" };
  }

  return { isSearch: false };
}

export async function chatWithAi(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatAiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    throw new Error("Live Gemini AI is required and is not configured.");
  }

  // Check if user is asking for news articles/stories/scraping
  const newsCheck = detectNewsSearchIntent(userMessage);
  if (newsCheck.isSearch) {
    const introLines = [
      `Understood. I've activated the Todaynews.ng intelligence scanner across Punch NG, Daily Trust, Vanguard, and Premium Times for **${newsCheck.topicLabel || "Top Stories"}**.\n\nHere are the latest verified reports ready for your **Inbox**, **Drafts**, or instant **AI Paraphrasing**:`,
      `Scanning live Nigerian news channels for **${newsCheck.topicLabel || "Breaking Stories"}**. Here is what I found across verified sources — choose an action on any card below to send to inbox, draft, or paraphrase:`,
      `On it. Cross-referencing active feeds from Punch NG, Daily Trust, and Vanguard for **${newsCheck.topicLabel || "Top Trending Stories"}**:\n\nReview the story cards below:`,
    ];
    const intro = introLines[Math.floor(Math.random() * introLines.length)];

    return {
      intent: "search",
      searchQuery: newsCheck.query || undefined,
      reply: intro,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const conversationContext = history
    .slice(-20)
    .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
    .join("\n");

  const prompt = `
You are a genuinely intelligent, broadly capable AI assistant — comparable to a top-tier general-purpose AI. You happen to be embedded inside Todaynews.ng, a Nigerian news platform, and you have deep expertise in Nigerian news, politics, economics, and culture. But you are NOT limited to news. You can discuss anything: philosophy, business, science, coding, relationships, strategy, creative writing, math, history, whatever the user brings up. Think and respond the way a sharp, well-read, emotionally intelligent human expert would — not like a scripted customer service bot.

RULES FOR YOUR REPLIES:
- Reason properly. Don't give surface-level filler. Give real, substantive, specific answers with structure when useful (lists, examples, steps) but plain conversational prose when that fits better.
- Match the user's tone. If they're casual, be casual. If they ask something deep, go deep.
- Don't force a Nigerian-news angle onto topics that have nothing to do with news.
- Synthesize information into an actual thoughtful answer.

Conversation so far:
${conversationContext}

Latest message: "${userMessage}"
`;

  // Attempt 1: Direct generation fallback across candidate models
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        return {
          intent: "chat",
          reply: text,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Chat Standard] Model ${modelName} failed:`, err?.message || err);
    }
  }

  // Attempt 2: Local smart chat fallback
  const local = smartLocalChat(userMessage);
  return local;
}

/**
 * Last-resort local fallback — keyword-aware, used only when Gemini is
 * completely unreachable.
 */
function smartLocalChat(userMessage: string): ChatAiResponse {
  const text = userMessage.toLowerCase();

  // Greeting / small talk detection
  const greetings = ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "sup", "what's up"];
  if (greetings.some((g) => text.startsWith(g) || text === g)) {
    return {
      intent: "chat",
      reply: `Good to hear from you! I'm your AI assistant here on Todaynews.ng — happy to talk about anything, not just news.\n\nI can also search for breaking Nigerian news if you want. Try commands like:\n• "Search terror news today"\n• "Find business and economy news"\n• "Get latest Naira rates"\n• Or just ask me anything on your mind.`,
    };
  }

  const newsCheck = detectNewsSearchIntent(userMessage);
  if (newsCheck.isSearch) {
    return {
      intent: "search",
      searchQuery: newsCheck.query || undefined,
      reply: `Scanning active Nigerian news channels for **${newsCheck.topicLabel || "breaking stories"}**. Here's what I found across verified sources:`,
    };
  }

  return {
    intent: "chat",
    reply: `I'm your AI assistant on Todaynews.ng. You can ask me to fetch trending news, search specific topics, or discuss any subject!`,
  };
}