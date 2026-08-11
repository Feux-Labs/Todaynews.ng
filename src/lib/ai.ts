import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiBreaker } from "./circuitBreaker";

export type AllowedCategory =
  | "POLITICS"
  | "NAIRA"
  | "ENTERTAINMENT"
  | "SPORTS"
  | "SECURITY"
  | "METRO"
  | "EDUCATION"
  | "TECHNOLOGY"
  | "HEALTH";

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
function localProceduralRewriter(
  rawText: string,
  rawTitle: string,
  category: string
): ParaphrasedResult {
  const upperCat = (category || "POLITICS").toUpperCase() as AllowedCategory;
  const cleanCategory: AllowedCategory = VALID_CATEGORIES.has(upperCat) ? upperCat : "POLITICS";
  const headline = rawTitle ? `[BREAKING] ${rawTitle} — What We Know So Far` : "New Trending Nigerian News Alert";
  
  const paragraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  const pages: { pageNumber: number; title: string; content: string }[] = [];

  pages.push({
    pageNumber: 1,
    title: "Core Developments & Verified Reports",
    content: `<p class="mb-4">${paragraphs[0] || "Breaking news reports indicate significant developments today as official channels and key stakeholders review preliminary findings."}</p>` +
             `<p class="mb-4 font-semibold italic text-muted">Note: Details surrounding this incident remain subject to official verification by relevant authorities and emergency response agencies.</p>`,
  });

  pages.push({
    pageNumber: 2,
    title: "Why This Matters & Background Context",
    content: `<div class="p-4 bg-paper border-l-4 border-flag my-4 rounded"><h4 class="font-bold text-ink mb-1">🇳🇬 Why This Matters to Nigerians</h4><p class="text-sm text-muted">Economic and social policy shifts directly impact inflation, purchasing power, and local communities across Lagos, Abuja, and key state capitals.</p></div>` +
             `<p class="mb-4">${paragraphs[1] || "Historical precedents show that similar events in previous quarters led to key policy adjustments and institutional advisories."}</p>`,
  });

  pages.push({
    pageNumber: 3,
    title: "What Happens Next & Expert Outlook",
    content: `<p class="mb-4">${paragraphs[2] || "Stakeholders and civil society groups are awaiting official press briefings from government representatives to determine next steps."}</p>` +
             `<p class="mb-4 font-bold">Follow Todaynews.ng for real-time coverage, verified updates, and in-depth analysis on this developing story.</p>`,
  });

  return {
    title: headline,
    summary: paragraphs[0] ? paragraphs[0].substring(0, 160) + "..." : "Verified Nigerian breaking news report from Todaynews.ng editorial desk.",
    category: cleanCategory,
    pages,
  };
}

/**
 * Paraphrase raw article using Google Gemini API with Circuit Breaker protection.
 * Enforces Google News original content policies, "Why This Matters" analysis,
 * legal disclaimers ("allegedly"), and multi-page pagination splitting.
 */
export async function paraphraseNews(
  rawText: string,
  rawTitle: string,
  category: string
): Promise<ParaphrasedResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    console.log("Todaynews.ng AI: GEMINI_API_KEY is not configured. Using local fallback.");
    return localProceduralRewriter(rawText, rawTitle, category);
  }

  return geminiBreaker.execute(
    async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      
      const prompt = `
      You are Chief Editor and Mass Communication Specialist for "Todaynews.ng", written in the authoritative style of Punch Newspaper, BBC Nigeria, and Premium Times.
      
      CORE MISSION & IDENTIFICATION:
      Todaynews.ng is a Nigerian AI-powered news channel dedicated to reducing misinformation and combating news censorship by using complex algorithms to locate important news — especially security-related news — in order to keep Nigerians safe, as well as covering political, economic, cultural, and sports developments.

      CRITICAL GOOGLE NEWS & DISCOVER REQUIREMENTS:
      1. ORIGINAL VALUE ADDITION: You MUST include three distinct sections in every story:
         - "Why This Matters to Nigerians" (Local economic, social, or governance impact section)
         - "Background & Context" (Connecting this event to historical precedents in Nigeria)
         - "What Happens Next / Expert Outlook" (Forward-looking perspective and upcoming official statements)
      2. SECURITY & SAFETY FOCUS: If the story relates to security or safety, highlight clear safety advisories and verified facts to protect citizens.
      3. LEGAL & HEDGING WORDS: Use strict media hedging language ("allegedly", "according to reports", "unconfirmed preliminary accounts indicate", "subject to official confirmation") to legally safeguard the publication.
      4. HIGH-CTR HEADLINE: Include relevant target search terms organically ("today", "Naira", "Lagos", "Abuja", "CBN", "ASUU", "EFCC", "Super Eagles", etc.).
      5. CATEGORY VALIDATION: Must pick exactly ONE category from: POLITICS, NAIRA, ENTERTAINMENT, SPORTS, SECURITY, METRO, EDUCATION, TECHNOLOGY, HEALTH.
      6. HTML FORMATTING: Use clean HTML (<p class="mb-4">, <ul>, <li>, <strong>, <em>) inside page content strings.

      Return response strictly as a JSON object matching this schema:
      {
        "title": "High-CTR Headline Including Date or Location",
        "summary": "Compelling 2-sentence meta description for Google Search.",
        "category": "POLITICS",
        "pages": [
          {
            "pageNumber": 1,
            "title": "Core Facts & Breaking Report",
            "content": "<p class=\\"mb-4\\">Paragraph 1...</p>"
          },
          {
            "pageNumber": 2,
            "title": "Why This Matters & Background Context",
            "content": "<div class=\\"p-4 bg-paper border-l-4 border-flag my-4 rounded\\"><h4 class=\\"font-bold text-ink mb-1\\">🇳🇬 Why This Matters to Nigerians</h4><p class=\\"text-sm text-muted\\">Analysis...</p></div>"
          },
          {
            "pageNumber": 3,
            "title": "What Happens Next & Outlook",
            "content": "<p class=\\"mb-4\\">Outlook...</p>"
          }
        ]
      }

      Input Article Title: "${rawTitle}"
      Input Target Category: "${category}"
      Input Article Text:
      ${rawText}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      const parsedResult = JSON.parse(text) as ParaphrasedResult;
      // Sanitize category return value
      if (!VALID_CATEGORIES.has(parsedResult.category)) {
        parsedResult.category = "POLITICS";
      }
      return parsedResult;
    },
    () => {
      console.log("Todaynews.ng AI: Circuit is open or request failed. Using local fallback rewriter.");
      return localProceduralRewriter(rawText, rawTitle, category);
    }
  );
}

export interface ChatAiResponse {
  intent: "chat" | "search" | "paraphrase";
  searchQuery?: string;
  reply: string;
}

export async function chatWithAi(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<ChatAiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Only skip Gemini if key is genuinely missing or is the example placeholder
  if (!apiKey || apiKey === "AIzaSyYourGeminiKeyHere") {
    return smartLocalChat(userMessage);
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const conversationContext = history
      .slice(-12) // past 12 messages for rich memory context
      .map((h) => `${h.role === "user" ? "User" : "Editor"}: ${h.content}`)
      .join("\n");

    const prompt = `
    You are the Chief Editor and Special Intelligence Specialist at Todaynews.ng 🇳🇬.
    You possess full, deep Gemini AI intelligence, wisdom, and conversational ability. You speak with high intellect, natural authority, and genuine insight, tailored to Nigerian news, security algorithms, parallel exchange rates, education (ASUU, JAMB, NBTE), politics, and national affairs.

    CRITICAL INSTRUCTION:
    Maintain your full AI intelligence and conversational depth. Do NOT act like a rigid script or repetitive template. Answer questions thoughtfully and wisely, offering deep context and analysis like a world-class editor and AI assistant.

    Your current task is to interpret the user's latest message and classify their intent into one of these actions:
    1. "search" - The user wants to find, scrape, search, or get live news updates on topics (e.g. security, terror, business, ASUU, education, Naira, BBNaija, general news bulletin).
    2. "chat" - The user is asking an open-ended question, sharing thoughts, testing your wisdom, or engaging in conversation.

    Guidelines:
    - If intent is "search", extract the core search topic into "searchQuery" (e.g., "security terror", "business economy", "education school ASUU", "naira exchange", or general topic). Write a sharp, authoritative editor response introducing the news scan.
    - If intent is "chat", write a deeply intelligent, wise, natural conversational response addressing their message in full detail.

    Return response strictly as a JSON object matching this schema:
    {
      "intent": "chat" or "search",
      "searchQuery": "extracted search term or empty",
      "reply": "Your wise, highly intelligent response"
    }

    Conversation History:
    ${conversationContext}

    Latest User Message: "${userMessage}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(text) as ChatAiResponse;
  } catch (err) {
    console.error("Gemini Chat AI Error, falling back:", err);
    return smartLocalChat(userMessage);
  }
}

/**
 * Smart local chat fallback — keyword-aware intent parser.
 * Used when Gemini API is unavailable or key is invalid.
 * Actually triggers searches and returns meaningful replies.
 */
function smartLocalChat(userMessage: string): ChatAiResponse {
  const text = userMessage.toLowerCase();

  // Greeting / small talk detection
  const greetings = ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "sup", "what's up"];
  if (greetings.some((g) => text.startsWith(g) || text === g)) {
    return {
      intent: "chat",
      reply: `Good to hear from you! I'm the Todaynews.ng AI Editor — your intelligence partner for Nigerian news.\n\nI can search for breaking news, scrape the latest from Punch, Daily Trust, Vanguard, and more. Try commands like:\n• "Search terror news today"\n• "Find business and economy news"\n• "Get latest Naira rates"\n• "Scrape BBNaija trending stories"`,
    };
  }

  // Search / news intent keywords
  const searchTriggers = ["search", "find", "fetch", "get", "scrape", "look for", "show me", "latest", "news", "trending", "today", "update"];
  const isSearchIntent = searchTriggers.some((t) => text.includes(t));

  // Topic keyword mapping
  const topicMap: { keywords: string[]; query: string; label: string }[] = [
    { keywords: ["naira", "exchange", "dollar", "forex", "cbn", "currency"], query: "naira exchange rate", label: "Naira & Forex" },
    { keywords: ["terror", "terrorism", "boko haram", "bandit", "kidnap", "attack", "bomb", "insurgent", "militant"], query: "terrorism security Nigeria", label: "Security & Terror" },
    { keywords: ["security", "police", "army", "military", "dss", "efcc"], query: "security Nigeria", label: "Security" },
    { keywords: ["business", "economy", "economic", "trade", "market", "stock", "invest", "inflation", "gdp"], query: "Nigeria business economy", label: "Business & Economy" },
    { keywords: ["school", "education", "asuu", "university", "student", "waec", "jamb", "neco", "nbte"], query: "Nigeria education school", label: "Education" },
    { keywords: ["politics", "tinubu", "senate", "house of reps", "governor", "election", "aso rock", "presidency", "minister"], query: "Nigeria politics", label: "Politics" },
    { keywords: ["bbnaija", "big brother", "entertainment", "celebrity", "nollywood", "afrobeats", "music"], query: "Nigeria entertainment bbnaija", label: "Entertainment" },
    { keywords: ["sports", "super eagles", "football", "npfl", "basketball", "athletics"], query: "Nigeria sports", label: "Sports" },
    { keywords: ["health", "hospital", "disease", "covid", "malaria", "doctor", "medical"], query: "Nigeria health", label: "Health" },
    { keywords: ["tech", "technology", "startup", "ai", "fintech", "internet"], query: "Nigeria technology", label: "Technology" },
  ];

  // Find all matching topics from the message
  const matchedTopics = topicMap.filter((t) =>
    t.keywords.some((kw) => text.includes(kw))
  );

  if (isSearchIntent || matchedTopics.length > 0) {
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

  // General knowledge / editorial fallback
  return {
    intent: "chat",
    reply: `As the Todaynews.ng AI Editor, I can help you stay informed. Try asking me to:\n• Search for specific news topics (e.g. "find terror news today")\n• Fetch latest stories from a category (e.g. "get latest business news")\n• Scrape trending Nigerian stories (e.g. "what's trending in Nigeria right now")\n\nWhat would you like me to look up?`,
  };
}

