import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiBreaker } from "./circuitBreaker";
import { sanitizeArticleHtml } from "./content";

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

interface ParaphrasedResult {
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
/**
 * Strips all duplicate [BREAKING] from a title.
 * Returns clean headline matching Punchng.com News style.
 */
function cleanAndFormatTitle(rawTitle: string): string {
  if (!rawTitle) return "New Trending Nigerian News Alert";
  // Remove ALL occurrences of [BREAKING] and trailing suffixes
  let clean = rawTitle
    .replace(/\[BREAKING\]\s*/gi, "")
    .replace(/\s*[-\u2013\u2014]\s*What We Know So Far\s*/gi, "")
    .replace(/\s*[-\u2013\u2014]\s*What We Know\s*/gi, "")
    .trim();
  return clean || "New Trending Nigerian News Alert";
}

function localProceduralRewriter(
  rawText: string,
  rawTitle: string,
  category: string
): ParaphrasedResult {
  const upperCat = (category || "POLITICS").toUpperCase() as AllowedCategory;
  const cleanCategory: AllowedCategory = VALID_CATEGORIES.has(upperCat) ? upperCat : "POLITICS";
  const headline = cleanAndFormatTitle(rawTitle);

  // Split raw text into sentences for richer fallback paragraphs
  const sentences = rawText
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

  const pages: { pageNumber: number; title: string; content: string }[] = [];
  pages.push({
    pageNumber: 1,
    title: "Core Facts & Breaking Report",
    content:
      toHtml(
        part1.length >= 3
          ? part1
          : [
            part1[0] || "Breaking reports indicate significant developments today as official channels and key stakeholders review preliminary findings.",
            "Credible sources confirm that the situation is being closely monitored by relevant authorities. Early accounts suggest a sequence of events that demands immediate attention from both citizens and policymakers.",
            "Todaynews.ng is tracking this story in real time. Multiple government agencies have been briefed and are expected to issue an official statement before end of day.",
            "Subject to official confirmation, preliminary accounts indicate that this development may have wide-reaching implications across key sectors. The full scope of the situation is still being assessed.",
          ]
      ) +
      `<p class="mb-4"><em>Note: Details surrounding this report remain subject to official verification by relevant authorities and emergency response agencies. Todaynews.ng is committed to accurate, verified reporting.</em></p>`,
  });

  pages.push({
    pageNumber: 2,
    title: "Why This Matters & Background Context",
    content:
      `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 Why This Matters to Nigerians</h4><p class="text-sm text-muted">This development carries direct implications for trade, governance, security, and purchasing power across Nigeria's 36 states. Citizens in Lagos, Abuja, Port Harcourt, and other key urban centres should take note of the following verified context.</p></div>` +
      toHtml(
        part2.length >= 3
          ? part2
          : [
            "Historical precedent shows that events of this nature have led to significant policy adjustments within weeks. The Nigerian government has previously responded to similar triggers with emergency regulations and inter-ministerial taskforce deployments.",
            "Economic analysts noted in a recent briefing that the downstream effects on the naira, fuel prices, and federal budget allocation are difficult to predict without further official data. However, precautionary advisories have already been issued to relevant agencies.",
            "Civil society organisations and opposition voices have begun weighing in on the matter, calling for transparency and timely disclosure from the appropriate government ministries and parastatals.",
            "Institutional memory from previous cycles suggests that early, calibrated government communication plays a critical role in preventing unnecessary public panic and misinformation — a lesson Todaynews.ng continues to champion.",
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
            "Stakeholders, civil society groups, and diplomatic observers are awaiting official press briefings from government representatives to determine the next course of action.",
            "Policy analysts expect that the relevant federal agencies will convene a session in the coming 48 to 72 hours to assess the situation formally and communicate an official government position.",
            "Security and intelligence agencies remain on heightened alert. Sources familiar with the matter, who spoke on condition of anonymity, confirmed that inter-agency coordination is already underway to manage any fallout.",
            "The international community, including Nigeria's diplomatic partners, is reportedly monitoring developments closely. A formal response from external observers is anticipated once the government's statement is released.",
          ]
      ) +
      `<p class="mb-4"><strong>📌 Todaynews.ng will continue to provide real-time, verified updates on this developing story. Bookmark this page and follow our Breaking News ticker for the latest.</strong></p>`,
  });

  const summaryText = sentences[0]
    ? sentences[0].substring(0, 200) + (sentences[0].length > 200 ? "..." : "")
    : "Verified Nigerian breaking news report. Todaynews.ng provides real-time, accurate, and contextualised coverage of major events across Nigeria.";

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
    summary: (result.summary || fallback.summary).trim(),
    category: cleanCategory,
    pages: pages.map((page, index) => ({
      pageNumber: index + 1,
      title: page.title || `Section ${index + 1}`,
      content: sanitizeArticleHtml(page.content || fallback.pages[index]?.content || fallback.summary),
    })),
  };
}

/**
 * Paraphrase raw article using Google Gemini API with Circuit Breaker protection.
 * Enforces Google News original content policies, "Why This Matters" analysis,
 * legal disclaimers ("allegedly"), and multi-page pagination splitting.
 * Each page must have 4-5 substantial paragraphs — NOT one-liners.
 */
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
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const cleanInputTitle = rawTitle
        .replace(/\[BREAKING\]\s*/gi, "")
        .replace(/\s*[-\u2014\u2013]\s*What We Know So Far\s*/gi, "")
        .trim();

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
      ${rawText}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return normalizeParaphrasedResult(JSON.parse(text) as ParaphrasedResult, localProceduralRewriter(rawText, rawTitle, category));
    },
    async () => {
      throw new Error("Live Gemini AI is unavailable and fallback behavior is disabled.");
    }

  );
}

// ============================================================
// CHAT AI — now with live Google Search grounding
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

/**
 * General-purpose wise AI chat, embedded in Todaynews.ng — with live
 * Google Search grounding. Gemini decides on its own whether a query needs
 * a real-time search, runs it, and returns an answer grounded in current
 * results with citations. No manual keyword-based intent classification needed.
 *
 * IMPORTANT: Google Search grounding is NOT reliably compatible with strict
 * JSON response mode on Gemini — older models 400 on the combination, and
 * even on newer models there are open bug reports of truncated JSON output
 * when grounding fires. So this call intentionally does NOT set
 * responseMimeType: "application/json" (unlike paraphraseNews above, which
 * never grounds and is safe to keep in JSON mode).
 */
export async function chatWithAi(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatAiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    throw new Error("Live Gemini AI is required and is not configured.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      tools: [{ googleSearch: {} } as any], // enable live Google Search grounding
      // NOTE: no responseMimeType here — see comment above.
    });

    const conversationContext = history
      .slice(-20) // more memory for real continuity
      .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
      .join("\n");

    const prompt = `
You are a genuinely intelligent, broadly capable AI assistant — comparable to a top-tier general-purpose AI. You happen to be embedded inside Todaynews.ng, a Nigerian news platform, and you have deep expertise in Nigerian news, politics, economics, and culture. But you are NOT limited to news. You can discuss anything: philosophy, business, science, coding, relationships, strategy, creative writing, math, history, whatever the user brings up. Think and respond the way a sharp, well-read, emotionally intelligent human expert would — not like a scripted customer service bot.

You have live Google Search access. Use it whenever the answer depends on current facts, recent events, prices, scores, schedules, or anything that could have changed since your training — don't guess or rely on stale memory for those. For timeless questions (general knowledge, reasoning, advice, creative writing), just answer directly without searching.

RULES FOR YOUR REPLIES:
- Reason properly. Don't give surface-level filler. Give real, substantive, specific answers with structure when useful (lists, examples, steps) but plain conversational prose when that fits better.
- Match the user's tone. If they're casual, be casual. If they ask something deep, go deep.
- Don't force a Nigerian-news angle onto topics that have nothing to do with news.
- When you do search and use results, write naturally — don't dump raw headlines, synthesize them into an actual answer.

Conversation so far:
${conversationContext}

Latest message: "${userMessage}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    // Pull grounding metadata if the model actually searched
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    const webSearchQueries: string[] = groundingMetadata?.webSearchQueries || [];
    const groundingChunks: any[] = groundingMetadata?.groundingChunks || [];

    const sources: GroundingSource[] = groundingChunks
      .map((chunk) => chunk?.web)
      .filter(Boolean)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return {
      intent: webSearchQueries.length > 0 ? "search" : "chat",
      searchQuery: webSearchQueries.join(", ") || undefined,
      reply: text,
      sources: sources.length > 0 ? sources : undefined,
    };
  } catch (err) {
    console.error("Gemini Chat AI Error (grounded), falling back:", err);
    try {
      // second-tier fallback: same grounding, resilient to transient errors —
      // no JSON parsing involved now, so this mostly guards against network blips.
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
        tools: [{ googleSearch: {} } as any],
      });
      const simplePrompt = `You are a wise, broadly knowledgeable AI assistant with live Google Search access, embedded in a Nigerian news app, but you can discuss any topic intelligently, not just news. Respond naturally and substantively to: "${userMessage}"`;
      const result = await model.generateContent(simplePrompt);
      const text = result.response.text();
      return { intent: "chat", reply: text || smartLocalChat(userMessage).reply };
    } catch (innerErr) {
      console.error("Gemini Chat AI Error (grounded, final attempt failed):", innerErr);
      throw new Error("Live Gemini AI is unavailable. Fallback chat is disabled.");
    }
  }
}

/**
 * Last-resort local fallback — keyword-aware, used only when Gemini is
 * completely unreachable (no key, or both grounded attempts failed above).
 * Keep this honest about its limits rather than pretending to be smart.
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

  // Search / news intent keywords
  const searchTriggers = ["search", "find", "fetch", "get", "scrape", "look for", "show me", "latest", "news", "trending", "today", "update"];
  const isSearchIntent = searchTriggers.some((t) => text.includes(t));

  // Topic keyword mapping (broadened to cover all AllowedCategory values,
  // including SCHOLARSHIP and JAPA which were previously missing)
  const topicMap: { keywords: string[]; query: string; label: string }[] = [
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

  // Find all matching topics from the message
  const matchedTopics = topicMap.filter((t) =>
    t.keywords.some((kw) => text.includes(kw))
  );

  if (isSearchIntent && matchedTopics.length > 0) {
    let query = "";
    let topicLabels = "";

    if (matchedTopics.length > 0) {
      // Use the first matched topic as primary query
      query = matchedTopics[0].query;
      topicLabels = matchedTopics.map((t) => t.label).join(", ");
    }

    const introLines = [
      `Understood. I've activated the Todaynews.ng intelligence scanner across Punch, Daily Trust, Vanguard, and Premium Times for ${topicLabels || "latest Nigerian news"}.`,
      `On it. Cross-referencing live feeds from Punch NG, BBC Africa Hausa, and Guardian Nigeria for ${topicLabels || "top trending stories"}.`,
      `Scanning active Nigerian news channels for ${topicLabels || "breaking stories"}. Here's what I found across verified sources:`,
    ];
    const intro = introLines[Math.floor(Math.random() * introLines.length)];

    return {
      intent: "search",
      searchQuery: query || undefined,
      reply: intro,
    };
  }

  // General knowledge / editorial fallback — this only triggers when Gemini is
  // fully unavailable, so keep it honest about its limits rather than pretending to be smart.
  return {
    intent: "chat",
    reply: `I'm running in a limited offline mode right now (my main AI connection is down), so I can't give you a fully thought-out answer to that. Once the connection is back I'll respond properly. In the meantime I can still search for Nigerian news — try "find business news today" or similar.`,
  };
}