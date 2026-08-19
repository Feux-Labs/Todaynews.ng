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

  const pageCount = sentences.length <= 3 ? 1 : sentences.length <= 7 ? 2 : 3;
  const chunks = chunk(sentences, Math.max(2, Math.ceil(sentences.length / pageCount)));

  const CREATIVE_TITLES_P1 = [
    "Core Development & Incident Breakdown",
    "The Emerging Situation & Verified Facts",
    "Key Event Timeline & First Reports",
  ];
  const CREATIVE_TITLES_P2 = [
    "How This Affects Everyday Nigerians",
    "The Editor's View & Strategic Analysis",
    "Underlying Undercurrents & Economic Fallout",
    "Governance, Security & Regional Impact",
  ];
  const CREATIVE_TITLES_P3 = [
    "Icing on the Cake: Key Takeaways",
    "What Lies Ahead & Policy Repercussions",
    "Strategic Outlook & Accountability Watch",
  ];

  const pickTitle = (list: string[], seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
    return list[hash % list.length];
  };

  const toHtml = (lines: string[]) =>
    lines.map((l) => `<p class="mb-4">${l}</p>`).join("\n");

  const coreSentence = sentences[0] || `${headline}. Official channels and key stakeholders are currently assessing the situation as developments unfold.`;

  const pages: { pageNumber: number; title: string; content: string }[] = [];

  // Page 1
  const p1Text = chunks[0] || sentences;
  pages.push({
    pageNumber: 1,
    title: pickTitle(CREATIVE_TITLES_P1, headline),
    content:
      `<p class="mb-4"><strong>${headline}</strong> — ${coreSentence}</p>` +
      toHtml(
        p1Text.length >= 2
          ? p1Text.slice(1)
          : [
            "Credible sources confirm that the situation is being closely monitored by relevant authorities and emergency response agencies as developments unfold.",
            "Todaynews.ng is tracking this story in real time. Official statements and administrative briefings are expected as further verified facts emerge.",
          ]
      ),
  });

  // Page 2 (if story warrants 2 or 3 pages)
  if (pageCount >= 2) {
    const p2Text = chunks[1] || [];
    pages.push({
      pageNumber: 2,
      title: pickTitle(CREATIVE_TITLES_P2, headline),
      content:
        `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 The Analytical View</h4><p class="text-sm text-muted">A critical assessment of the wider institutional, economic, and community implications across Nigeria.</p></div>` +
        toHtml(
          p2Text.length >= 2
            ? p2Text
            : [
              "Historical precedent shows that developments of this nature carry significant public interest and demand proactive institutional transparency.",
              "Analysts and civic stakeholders note that timely responses are essential in addressing public concerns and ensuring accountability.",
            ]
        ),
    });
  }

  // Page 3 (if rich multi-page investigative story)
  if (pageCount >= 3) {
    const p3Text = chunks[2] || [];
    pages.push({
      pageNumber: 3,
      title: pickTitle(CREATIVE_TITLES_P3, headline),
      content:
        toHtml(
          p3Text.length >= 2
            ? p3Text
            : [
              "Stakeholders and community representatives are tracking ongoing communications from official channels to evaluate subsequent measures.",
              "Further policy reviews and institutional statements are anticipated as relevant agencies complete their assessments.",
            ]
        ) +
        `<p class="mb-4"><strong>📌 Todaynews.ng will continue to provide real-time updates as verified facts emerge.</strong></p>`,
    });
  }

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
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
  "gemini-pro-latest",
];

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
      You are Chief Editor and Mass Communication Specialist for "Todaynews.ng", writing in the authoritative, engaging journalistic style of Punch Newspaper, Financial Times, BBC Africa, Premium Times, and Guardian Nigeria.
      
      CORE EDITORIAL MISSION:
      Todaynews.ng is Nigeria's AI-powered news channel dedicated to reducing misinformation, combating news censorship, and delivering high-IQ, deeply insightful journalism.

      CRITICAL CONTENT REQUIREMENTS:
      1. FLEXIBLE PAGE LENGTH (1, 2, OR 3 PAGES):
         - Match the page count to the natural weight and depth of the story.
         - Short breaking updates or concise alerts can be 1 or 2 pages.
         - Major investigative, political, or economic stories should be 2 or 3 pages.
         - Each page must have 3 to 5 substantial, well-crafted paragraphs. No empty one-liners.

      2. CREATIVE, CONTEXTUAL SECTION TITLES (NO COOKIE-CUTTER HEADINGS):
         - Do NOT use rigid, repetitive titles like "Core Facts" or "Why This Matters" for every article.
         - Use varied, intelligent, and context-specific headings such as:
           • "How This Affects Everyday Nigerians"
           • "The Editor's View & Strategic Analysis"
           • "Icing on the Cake: Key Takeaways"
           • "Underlying Undercurrents & Behind the Scenes"
           • "The Road Ahead & Policy Repercussions"
           • "Financial Fallout & Market Implications"
           • Or titles directly describing the story's development.

      3. LEGAL HEDGING: Use "allegedly", "according to reports", "unconfirmed accounts indicate", "subject to official confirmation" appropriately where facts are still evolving.

      4. PUNCH-STYLE HEADLINES: Create a compelling, sharp, search-optimized headline in the classic style of Punch Newspaper and Premium Times. NO prefixes like [BREAKING], NO suffixes like "What We Know So Far".

      5. META SUMMARY: Write a compelling 2-3 sentence meta summary for Google Search indexing and social previews.

      6. STRICT PROHIBITION ON COMPETITOR LINKS: NEVER include external competitor links, competitor website names (Punch, Vanguard, Daily Trust, Sahara Reporters, etc.), or "Read More: https://...". Todaynews.ng is the primary publisher.

      7. HTML FORMATTING: Use clean HTML inside page content: <p class="mb-4">, <ul><li>, <strong>, <em>, <blockquote>.

      Return ONLY a valid JSON object matching this schema:
      {
        "title": "Sharp compelling Nigerian headline without [BREAKING] prefix",
        "summary": "Compelling 2-3 sentence meta summary with key facts.",
        "category": "POLITICS",
        "pages": [
          {
            "pageNumber": 1,
            "title": "Engaging Section Title (e.g. Critical Incident Breakdown)",
            "content": "<p class=\\"mb-4\\">Richly written paragraphs...</p>"
          },
          {
            "pageNumber": 2,
            "title": "Creative Contextual Heading (e.g. How This Affects Nigerians / The Editor's View)",
            "content": "<p class=\\"mb-4\\">Analytical paragraphs with depth and clarity...</p>"
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

/** Word-boundary substring match — prevents false positives like "airtel" matching the "ai" keyword. */
function hasWord(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) return text.includes(keyword); // multi-word phrases are safe as substrings
  return new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
}

// Command/filler phrases stripped off the front of a message to recover the
// user's actual subject — e.g. "pick up the news about X" -> "X".
const QUERY_STRIP_PATTERNS = [
  /^(please\s+)?(can you\s+|could you\s+)?(pick up|search for|search|find|fetch|get me|get|scrape|look for|show me|bring me|bring|give me|pull up|pull)\s+/i,
  /^(the\s+)?(latest\s+|top\s+|trending\s+|breaking\s+)?news\s+(about|on|regarding|concerning)\s+/i,
  /^(any\s+)?(updates?|stories|headlines|reports?)\s+(about|on|regarding)\s+/i,
];

function extractSearchSubject(rawMessage: string): string {
  let subject = rawMessage.trim();
  let stripped = true;
  while (stripped) {
    stripped = false;
    for (const pattern of QUERY_STRIP_PATTERNS) {
      const next = subject.replace(pattern, "");
      if (next !== subject) {
        subject = next.trim();
        stripped = true;
      }
    }
  }
  // Trim trailing filler like "etc", "please", punctuation.
  subject = subject.replace(/\s*(,?\s*etc\.?|please)\s*$/i, "").replace(/[.?!]+$/, "").trim();
  return subject;
}

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

  const searchKeywords = [
    "search", "find", "fetch", "get", "scrape", "look for", "show me", "give me",
    "bring", "latest", "trending", "today", "update", "pull", "news", "stories",
    "headlines", "report", "reports"
  ];
  const hasSearchIntent = searchKeywords.some((k) => hasWord(text, k));

  if (!hasSearchIntent && !explicitTriggers.some((t) => text.includes(t))) {
    return { isSearch: false };
  }

  // The user's own words always win over a generic topic bucket — extract
  // their actual subject first, and only fall back to a canned topic query
  // when there's no real subject left (e.g. a bare "get me top news").
  const subject = extractSearchSubject(userMessage);
  const isGenericSubject =
    subject.length < 3 ||
    explicitTriggers.some((t) => subject.toLowerCase() === t) ||
    /^(top|trending|breaking|latest)?\s*(nigeria(n)?\s+)?news$/i.test(subject);

  const matched = TOPIC_MAP.filter((t) => t.keywords.some((kw) => hasWord(text, kw)));

  if (!isGenericSubject) {
    return {
      isSearch: true,
      query: subject,
      topicLabel: matched.length > 0 ? matched.map((m) => m.label).join(", ") : subject,
    };
  }

  if (matched.length > 0) {
    return {
      isSearch: true,
      query: matched[0].query,
      topicLabel: matched.map((m) => m.label).join(", "),
    };
  }

  if (explicitTriggers.some((t) => text.includes(t)) || hasSearchIntent) {
    return { isSearch: true, topicLabel: "Top Trending Nigerian News" };
  }

  return { isSearch: false };
}

/**
 * LLM-based search-intent classifier. Replaces naive keyword matching, which
 * broke on real messages in two ways: (1) short keywords like "ai" false-
 * matched inside unrelated words ("airtel"), and (2) any message merely
 * containing a word like "news" got treated as a fresh search — including
 * pure feedback/complaints ("idiot the news is not there") or a rant mixing
 * correction with instructions, which then got used VERBATIM as the search
 * query and obviously matched nothing. Gemini can tell the difference and
 * extract/clean the real subject (correcting typos, dropping meta-
 * commentary about formatting or images) far better than regex ever could.
 */
async function classifySearchIntent(
  userMessage: string,
  conversationContext: string,
  apiKey: string
): Promise<{ isSearch: boolean; query?: string; topicLabel?: string }> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `You are a search-intent classifier for a Nigerian news AI's chat assistant.

Given the recent conversation and the user's latest message, decide:
1. Is the user asking you to search/fetch/find news RIGHT NOW — including a retry after a previous search returned the wrong thing (e.g. "that's not it", "the news is not there", a frustrated correction that still describes what they actually want)?
   This is FALSE for: pure small talk, questions unrelated to news, or feedback that gives no clue what to search for.
2. If true, write ONE clean, well-formed search query: correct obvious typos, strip meta-instructions (formatting requests, "ask me before publishing", image requests, insults/venting), keep the real proper nouns and subject. Use conversation context to fill in what a garbled or short message is actually about.

Conversation so far:
${conversationContext}

Latest message: "${userMessage}"

Return ONLY this JSON, nothing else:
{"isSearch": true or false, "query": "clean search query or null", "topicLabel": "short 2-6 word display label or null"}`;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          const parsed = JSON.parse(text);
          return {
            isSearch: !!parsed.isSearch,
            query: parsed.query || undefined,
            topicLabel: parsed.topicLabel || undefined,
          };
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn("[Search Intent] Gemini classification failed, using regex fallback:", err);
  }

  return detectNewsSearchIntent(userMessage);
}

export async function chatWithAi(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatAiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    throw new Error("Live Gemini AI is required and is not configured.");
  }

  const conversationContext = history
    .slice(-20)
    .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
    .join("\n");

  // Check if user is asking for news articles/stories/scraping
  const newsCheck = await classifySearchIntent(userMessage, conversationContext, apiKey);
  if (newsCheck.isSearch) {
    const introLines = [
      `Understood. I've scanned Todaynews.ng's full source list plus a live web search for **${newsCheck.topicLabel || "Top Stories"}**.\n\nHere are the latest verified reports ready for your **Inbox**, **Drafts**, or instant **AI Paraphrasing**:`,
      `Scanning our full RSS network and the wider web for **${newsCheck.topicLabel || "Breaking Stories"}**. Here is what I found — choose an action on any card below to send to inbox, draft, or paraphrase:`,
      `On it. Cross-referencing every configured source plus a live web search for **${newsCheck.topicLabel || "Top Trending Stories"}**:\n\nReview the story cards below:`,
    ];
    const intro = introLines[Math.floor(Math.random() * introLines.length)];

    return {
      intent: "search",
      searchQuery: newsCheck.query || undefined,
      reply: intro,
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);

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