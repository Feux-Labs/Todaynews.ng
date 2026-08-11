import { GoogleGenerativeAI } from "@google/generative-ai";

interface ParaphrasedResult {
  title: string;
  summary: string;
  category: "POLITICS" | "NAIRA" | "ENTERTAINMENT" | "SPORTS" | "SECURITY" | "METRO";
  pages: {
    pageNumber: number;
    title?: string;
    content: string;
  }[];
}

/**
 * Procedural offline rewriter when Gemini API key is not configured.
 * This simulates the AI splits and style transformation instantly.
 */
function localProceduralRewriter(
  rawText: string,
  rawTitle: string,
  category: string
): ParaphrasedResult {
  const cleanCategory = (category || "POLITICS").toUpperCase() as any;
  const headline = rawTitle ? `[LATEST] ${rawTitle} — What We Know So Far` : "New Trending Nigerian News Alert";
  
  // Split raw text into paragraphs
  const paragraphs = rawText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);

  const totalParagraphs = paragraphs.length;
  const pages: { pageNumber: number; title: string; content: string }[] = [];

  if (totalParagraphs <= 2) {
    // Single page equivalent split into two mini sections
    pages.push({
      pageNumber: 1,
      title: "Introduction & Development",
      content: `<p class="mb-4">${paragraphs[0] || "Breaking details are emerging from Abuja regarding today's national development."}</p>`,
    });
    pages.push({
      pageNumber: 2,
      title: "Public Reaction & Outcomes",
      content: `<p class="mb-4">${paragraphs[1] || "Civil society groups and stakeholders are currently analyzing the policy implications."}</p>`,
    });
  } else {
    // Dynamically split paragraphs into 3 pages
    const chunkSize = Math.ceil(totalParagraphs / 3);
    
    pages.push({
      pageNumber: 1,
      title: "Initial Disclosures & Core Facts",
      content: paragraphs.slice(0, chunkSize).map((p) => `<p class="mb-4">${p}</p>`).join(""),
    });

    pages.push({
      pageNumber: 2,
      title: "Key Details & Strategic Impacts",
      content: paragraphs.slice(chunkSize, chunkSize * 2).map((p) => `<p class="mb-4">${p}</p>`).join(""),
    });

    pages.push({
      pageNumber: 3,
      title: "What Happens Next & Full Advisory",
      content: paragraphs.slice(chunkSize * 2).map((p) => `<p class="mb-4">${p}</p>`).join("") + 
               `<p class="mb-4">Follow Todaynews.ng for continuous updates on this breaking story as it develops across the Federation.</p>`,
    });
  }

  return {
    title: headline,
    summary: paragraphs[0] ? paragraphs[0].substring(0, 160) + "..." : "Breaking news report from Todaynews.ng editorial team.",
    category: cleanCategory,
    pages,
  };
}

/**
 * Paraphrase raw article using Google Gemini API.
 * Structured with strict instructions for Nigerian news audience tone, High-CTR headlines,
 * and multi-page pagination splitting.
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    
    const prompt = `
      You are an expert Chief Editor and Mass Communication Specialist for "Todaynews.ng", written in the authoritative style of Punch Newspaper and BBC Nigeria.
      Your task is to take raw breaking news and rewrite it into a polished, high-CTR, SEO-optimized Nigerian news story split into a multi-page format (2 to 4 pages).
      
      MASS COMMUNICATION & JOURNALISTIC RULES:
      1. LEGAL & JOURNALISTIC ATTRIBUTION: Use professional media hedging language ("allegedly", "according to preliminary reports", "unconfirmed sources indicate", "awaiting official statement from police/CBN/ministry") whenever reporting sensitive, unverified, or breaking incidents to protect the newspaper legally.
      2. FACT INTEGRITY: Cross-synthesize the details logically. Highlight verified facts while clearly marking claims as reported by third parties.
      3. HIGH-CTR HEADLINE: Write an irresistible, search-optimized Nigerian headline using high-volume search terms (Lagos, Abuja, CBN, EFCC, ASUU, Naira, BBNaija, etc.).
      4. WRITING STYLE: Authentic Nigerian journalism — punchy, authoritative, citing key locations, institutions, and quotes.
      5. PAGINATION: Split content across 2 to 4 pages. Each page must have a short, engaging subtitle.
      6. HTML FORMATTING: Use clean HTML (<p class="mb-4">, <ul>, <li>, <strong>) inside the page content strings.
      
      Return response strictly as a JSON object matching this schema:
      {
        "title": "High CTR Article Title Here",
        "summary": "Brief 2-sentence meta description.",
        "category": "POLITICS", // Must be one of: POLITICS, NAIRA, ENTERTAINMENT, SPORTS, SECURITY, METRO
        "pages": [
          {
            "pageNumber": 1,
            "title": "Page 1 Catchy Subtitle",
            "content": "<p class=\\"mb-4\\">Paragraph 1...</p><p class=\\"mb-4\\">Paragraph 2...</p>"
          },
          {
            "pageNumber": 2,
            "title": "Page 2 Catchy Subtitle",
            "content": "<p class=\\"mb-4\\">Paragraph 3...</p><p class=\\"mb-4\\">Paragraph 4...</p>"
          }
        ]
      }

      Input Article Title: "${rawTitle}"
      Input Article Category Target: "${category}"
      Input Article Content:
      ${rawText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedResult = JSON.parse(text) as ParaphrasedResult;
    return parsedResult;
  } catch (error) {
    console.error("Gemini AI API Error, falling back to procedural rewriter:", error);
    return localProceduralRewriter(rawText, rawTitle, category);
  }
}
