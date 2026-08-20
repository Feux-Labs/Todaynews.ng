import { PrismaClient } from "@prisma/client";
import { INITIAL_ARTICLES, ArticleData } from "./sample-data";

// PrismaClient singleton pattern for dev (re-use across hot-reloads).
// In production (Vercel serverless), we create a new client per cold start
// since globals are NOT shared across concurrent serverless invocations.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Only cache globally in non-production to avoid hot-reload connection storms
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type ArticleStatus = "AI_PENDING" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED" | "REJECTED" | "PENDING";

interface PageViewRecord {
  id: string;
  articleSlug: string;
  category: string;
  visitedAt: Date;
}

/**
 * SYSTEM DESIGN: In-Memory Database Fallback with Memory-Leak Protection
 * Includes bounded array capacities, LRU-style eviction, and defensive object cloning.
 */
class InMemoryDb {
  private articles: ArticleData[] = [...INITIAL_ARTICLES];
  private subscribers: string[] = [];
  private pageViews: PageViewRecord[] = [];

  // Memory Leak Safeguards
  private readonly MAX_PAGE_VIEWS = 5000; // Cap page views array in RAM
  private readonly MAX_SUBSCRIBERS = 10000;

  constructor() {
    console.log("Todaynews.ng System Design: Loaded In-Memory DB with RAM leak protection.");
  }

  async getArticles(category?: string, status?: string, page: number = 1, limit: number = 10) {
    let list = [...this.articles];

    if (category) {
      list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      list = list.filter((a) => (a.status as string).toLowerCase() === status.toLowerCase());
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // System Design: Offset-based pagination
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: startIndex + limit < total,
      articles: paginatedItems,
    };
  }

  async getArticleBySlug(slug: string) {
    // View counting deliberately does NOT happen here — this getter is
    // called twice per request (generateMetadata + page render) and would
    // double-count on top of PageViewBeacon's client-side increment. See
    // recordPageView(), which is the single source of truth for views.
    const article = this.articles.find((a) => a.slug === slug);
    return article ? { ...article } : null;
  }

  async getArticleById(id: string) {
    const article = this.articles.find((a) => a.id === id);
    return article ? { ...article } : null;
  }

  async createArticle(data: Omit<ArticleData, "id" | "createdAt" | "views">) {
    const newArticle: ArticleData = {
      ...data,
      id: `art-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      views: 0,
    };
    this.articles.unshift(newArticle); // Unshift so newest is first
    return { ...newArticle };
  }

  async updateArticleStatus(id: string, status: ArticleStatus) {
    const article = this.articles.find((a) => a.id === id);
    if (article) {
      article.status = status as any;
      return { ...article };
    }
    return null;
  }

  async updateArticle(id: string, data: Partial<ArticleData>) {
    const article = this.articles.find((a) => a.id === id);
    if (article) {
      if (data.title !== undefined) article.title = data.title;
      if (data.summary !== undefined) article.summary = data.summary;
      if (data.category !== undefined) article.category = data.category;
      if (data.imageUrl !== undefined) article.imageUrl = data.imageUrl;
      if (data.status !== undefined) article.status = data.status;
      if (data.pages !== undefined) {
        article.pages = data.pages.map((p, idx) => ({
          pageNumber: idx + 1,
          title: p.title || null,
          content: p.content,
        }));
      }
      return { ...article };
    }
    return null;
  }

  async updateArticlePages(id: string, title: string, summary: string, category: any, pages: any[]) {
    const article = this.articles.find((a) => a.id === id);
    if (article) {
      article.title = title;
      article.summary = summary;
      article.category = category;
      article.pages = pages.map((p, idx) => ({
        pageNumber: idx + 1,
        title: p.title || null,
        content: p.content,
      }));
      return { ...article };
    }
    return null;
  }

  async deleteArticle(id: string) {
    const index = this.articles.findIndex((a) => a.id === id || a.slug === id);
    if (index !== -1) {
      this.articles.splice(index, 1);
      return true;
    }
    return false;
  }

  async addSubscriber(email: string) {
    if (!this.subscribers.includes(email)) {
      // Memory Leak Prevention: Evict oldest if array exceeds cap
      if (this.subscribers.length >= this.MAX_SUBSCRIBERS) {
        this.subscribers.shift();
      }
      this.subscribers.push(email);
    }
    return { email };
  }

  // --- Page View Analytics with RAM Eviction Safeguard ---
  async recordPageView(articleSlug: string, category?: string) {
    // Evict oldest 500 records if MAX_PAGE_VIEWS capacity reached
    if (this.pageViews.length >= this.MAX_PAGE_VIEWS) {
      this.pageViews = this.pageViews.slice(500);
    }

    this.pageViews.push({
      id: `pv-${Math.random().toString(36).substring(2, 9)}`,
      articleSlug,
      category: category || "UNKNOWN",
      visitedAt: new Date(),
    });

    // This is the single place articles.views gets incremented — matches
    // the real DB path (pageview API route), so counts stay honest.
    const article = this.articles.find((a) => a.slug === articleSlug);
    if (article) article.views += 1;
  }

  async getViewStats(period: "today" | "week" | "month" = "today") {
    // NOTE: this used to "sync" by inventing fake pageViews rows with random
    // timestamps whenever article.views didn't match the real recorded count
    // — i.e. fabricating analytics data instead of surfacing a real bug.
    // Now that view counting has a single source of truth (PageViewBeacon,
    // via recordPageView), the two stay honest on their own.

    const now = new Date();
    let cutoff: Date;

    switch (period) {
      case "today":
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const filtered = this.pageViews.filter((pv) => pv.visitedAt >= cutoff);
    const totalViews = filtered.length;

    const articleCounts: Record<string, number> = {};
    filtered.forEach((pv) => {
      articleCounts[pv.articleSlug] = (articleCounts[pv.articleSlug] || 0) + 1;
    });

    let topArticles = Object.entries(articleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({ slug, views: count }));

    if (topArticles.length === 0) {
      topArticles = this.articles
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map((a) => ({ slug: a.slug, views: a.views }));
    }

    const categoryCounts: Record<string, number> = {};
    this.articles
      .filter((a) => (a.status as string) === "PUBLISHED")
      .forEach((a) => {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      });

    const hourlyViews: { hour: string; views: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      const count = this.pageViews.filter(
        (pv) => pv.visitedAt >= hourStart && pv.visitedAt < hourEnd
      ).length;
      hourlyViews.push({
        hour: hourStart.toLocaleTimeString("en-NG", { hour: "2-digit", hour12: true }),
        views: count,
      });
    }

    return {
      totalViews,
      totalArticles: this.articles.filter((a) => (a.status as string) === "PUBLISHED").length,
      topArticles,
      categoryBreakdown: Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
      })),
      hourlyViews,
    };
  }

  async getArticleCount() {
    return {
      total: this.articles.length,
      published: this.articles.filter((a) => (a.status as string) === "PUBLISHED").length,
      drafts: this.articles.filter((a) => (a.status as string) === "DRAFT").length,
      pending: this.articles.filter((a) => (a.status as string) === "AI_PENDING" || (a.status as string) === "PENDING").length,
    };
  }
}

const globalForMemoryDb = global as unknown as { memoryDb: InMemoryDb };
export const memoryDb = globalForMemoryDb.memoryDb || new InMemoryDb();
if (process.env.NODE_ENV !== "production") globalForMemoryDb.memoryDb = memoryDb;

export const isDbConfigured = (): boolean => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[DB] DATABASE_URL is not set. Running in memory-only mode.");
    return false;
  }
  if (url.includes("ep-sample-123456")) {
    console.warn("[DB] DATABASE_URL is the placeholder sample value. Running in memory-only mode.");
    return false;
  }
  return true;
};
