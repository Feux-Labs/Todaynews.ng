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
      Your task is to take raw breaking news and rewrite it into an original, high-CTR, Google News-eligible Nigerian news story split into a multi-page format (2 to 4 pages).

      CRITICAL GOOGLE NEWS & DISCOVER REQUIREMENTS:
      1. ORIGINAL VALUE ADDITION: You MUST include three distinct sections in every story:
         - "Why This Matters to Nigerians" (Local economic, social, or governance impact section)
         - "Background & Context" (Connecting this event to historical precedents in Nigeria)
         - "What Happens Next / Expert Outlook" (Forward-looking perspective and upcoming official statements)
      2. LEGAL & HEDGING WORDS: Use strict media hedging language ("allegedly", "according to reports", "unconfirmed preliminary accounts indicate", "subject to official confirmation") to legally safeguard the publication.
      3. HIGH-CTR HEADLINE: Include relevant target search terms organically ("today", "Naira", "Lagos", "Abuja", "CBN", "ASUU", "EFCC", "Super Eagles", etc.).
      4. CATEGORY VALIDATION: Must pick exactly ONE category from: POLITICS, NAIRA, ENTERTAINMENT, SPORTS, SECURITY, METRO, EDUCATION, TECHNOLOGY, HEALTH.
      5. HTML FORMATTING: Use clean HTML (<p class="mb-4">, <ul>, <li>, <strong>, <em>) inside page content strings.

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
