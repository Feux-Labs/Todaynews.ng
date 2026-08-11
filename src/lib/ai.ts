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
      You are an expert Nigerian news editor and SEO specialist for "Todaynews.ng", working in the style of Punch Newspaper.
      Your task is to take the following raw news article and rewrite it to make it highly engaging, optimized for search engines, and split it into a multi-page format (minimum 2 pages, maximum 4 pages depending on length).
      
      CRITICAL INSTRUCTIONS:
      1. Write a highly clickable (High-CTR) Nigerian-centric headline. Focus on trending local search terms.
      2. Write a brief 2-sentence summary (meta description) for the article.
      3. Rewrite the body content entirely. It must sound like authentic Nigerian journalism (professional, punchy, calling out key locations like Abuja, Lagos, etc.). Keep it rich, detailed, and SEO-optimized.
      4. Split the article content across 2 to 4 pages (pagination format). Each page must have a short, catchy page title (e.g. "Page 1: The Initial Clash", "Page 2: Stakeholders React").
      5. Output HTML formatting inside the paragraph bodies (only clean <p> and list tags, no markdown inside the content string).
      6. Return the response strictly as a JSON object matching this schema:
      {
        "title": "High CTR Article Title Here",
        "summary": "Brief summary/meta description here.",
        "category": "POLITICS", // Must be one of: POLITICS, NAIRA, ENTERTAINMENT, SPORTS, SECURITY, METRO
        "pages": [
          {
            "pageNumber": 1,
            "title": "Page 1 Title",
            "content": "<p class=\\"mb-4\\">Paragraph 1 here...</p><p class=\\"mb-4\\">Paragraph 2 here...</p>"
          },
          {
            "pageNumber": 2,
            "title": "Page 2 Title",
            "content": "<p class=\\"mb-4\\">Paragraph 3 here...</p><p class=\\"mb-4\\">Paragraph 4 here...</p>"
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
