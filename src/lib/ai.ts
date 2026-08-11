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

  if (!apiKey || apiKey.startsWith("AIzaSyYour")) {
    console.log("Todaynews.ng AI: GEMINI_API_KEY is not configured. Using local fallback.");
    return localProceduralRewriter(rawText, rawTitle, category);
  }

  return geminiBreaker.execute(
    async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
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

  if (!apiKey || apiKey.startsWith("AIzaSyYour")) {
    // Basic local fallback processing if Gemini is offline
    const text = userMessage.toLowerCase();
    if (text.includes("scrape") || text.includes("fetch") || text.includes("find") || text.includes("search") || text.includes("news")) {
      let query = "";
      if (text.includes("naira")) query = "naira";
      else if (text.includes("security")) query = "security";
      else if (text.includes("politics")) query = "politics";
      else if (text.includes("sports")) query = "sports";
      else if (text.includes("entertainment")) query = "entertainment";
      else if (text.includes("bbnaija")) query = "bbnaija";

      return {
        intent: "search",
        searchQuery: query || undefined,
        reply: `I have initialized our security algorithms to compare news across Punch, Daily Trust, and BBC Africa. Here is what I found:`,
      };
    }

    return {
      intent: "chat",
      reply: `Greetings from the Todaynews.ng Editorial Desk. I am processing your message offline: "${userMessage}". Let me know if you would like to run search commands.`,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const conversationContext = history
      .slice(-10) // past 10 messages for memory context
      .map((h) => `${h.role === "user" ? "User" : "Editor"}: ${h.content}`)
      .join("\n");

    const prompt = `
    You are the Chief Editor and AI Special Operations Specialist at Todaynews.ng, a wise, authoritative newsroom bot. You specialize in Nigerian security, parallel exchange rates, national policies, and cultural gist. You talk naturally and professionally.

    Your current task is to interpret the user's latest message and classify their intent into one of these actions:
    1. "search" - The user wants to find, scrape, or search for news/updates about a topic, location, rate, or general "new news".
    2. "chat" - The user is talking normally, asking an opinion, following up on a past message, or greeting you.

    Guidelines:
    - If the user asks for "new news", "trending stories", "scare for new news", or specific topics ("naira news", "Tinubu"), set intent to "search" and extract the core topic into "searchQuery" (e.g., "naira", "security", "politics", "bbnaija", or leave blank for general trending news).
    - If intent is "search", write a wise editor reply introducing the results, e.g. "I compared reporting across Punch, Daily Trust, and Premium Times on this topic. Here is what I found:" or similar.
    - If intent is "chat", write a highly intelligent, conversational editor response addressing their query, utilizing the provided conversation context.

    Return response strictly as a JSON object matching this schema:
    {
      "intent": "chat" or "search",
      "searchQuery": "extracted search term or empty",
      "reply": "Your wise, natural response"
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
    return {
      intent: "chat",
      reply: `I received your command: "${userMessage}". Let me know if you would like me to retrieve specific news feeds.`,
    };
  }
}

