import { PrismaClient } from "@prisma/client";
import { INITIAL_ARTICLES, ArticleData } from "./sample-data";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// --- IN-MEMORY DATABASE FALLBACK FOR ZERO-SETUP LOCAL PLAYGROUNDS ---
// If the database URL is not set or Prisma connection fails, the application
// will automatically fall back to this local in-memory store so it never crashes!

export type ArticleStatus = "AI_PENDING" | "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "REJECTED" | "PENDING";

interface PageViewRecord {
  id: string;
  articleSlug: string;
  category: string;
  visitedAt: Date;
}

class InMemoryDb {
  private articles: ArticleData[] = [...INITIAL_ARTICLES];
  private subscribers: string[] = [];
  private pageViews: PageViewRecord[] = [];

  constructor() {
    console.log("Todaynews.ng: Loaded In-Memory Database Fallback.");
  }

  async getArticles(category?: string, status?: string) {
    let list = [...this.articles];
    if (category) {
      list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (status) {
      list = list.filter((a) => a.status.toLowerCase() === status.toLowerCase());
    }
    // Sort by date descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getArticleBySlug(slug: string) {
    const article = this.articles.find((a) => a.slug === slug);
    if (article) {
      // Increment views
      article.views += 1;
      return article;
    }
    return null;
  }

  async getArticleById(id: string) {
    return this.articles.find((a) => a.id === id) || null;
  }

  async createArticle(data: Omit<ArticleData, "id" | "createdAt" | "views">) {
    const newArticle: ArticleData = {
      ...data,
      id: `art-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      views: 0,
    };
    this.articles.push(newArticle);
    return newArticle;
  }

  async updateArticleStatus(id: string, status: ArticleStatus) {
    const article = this.articles.find((a) => a.id === id);
    if (article) {
      article.status = status as any;
      return article;
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
      return article;
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
      return article;
    }
    return null;
  }

  async deleteArticle(id: string) {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index !== -1) {
      this.articles.splice(index, 1);
      return true;
    }
    return false;
  }

  async addSubscriber(email: string) {
    if (!this.subscribers.includes(email)) {
      this.subscribers.push(email);
    }
    return { email };
  }

  // --- Page View Analytics ---
  async recordPageView(articleSlug: string, category?: string) {
    this.pageViews.push({
      id: `pv-${Math.random().toString(36).substring(2, 9)}`,
      articleSlug,
      category: category || "UNKNOWN",
      visitedAt: new Date(),
    });
  }

  async getViewStats(period: "today" | "week" | "month" = "today") {
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

    // Total views
    const totalViews = filtered.length;

    // Views per article (top 10)
    const articleCounts: Record<string, number> = {};
    filtered.forEach((pv) => {
      articleCounts[pv.articleSlug] = (articleCounts[pv.articleSlug] || 0) + 1;
    });
    const topArticles = Object.entries(articleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([slug, count]) => ({ slug, views: count }));

    // Views per category
    const categoryCounts: Record<string, number> = {};
    filtered.forEach((pv) => {
      categoryCounts[pv.category] = (categoryCounts[pv.category] || 0) + 1;
    });

    // Views per hour (last 24h)
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
      totalArticles: this.articles.filter((a) => a.status === "PUBLISHED").length,
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
      published: this.articles.filter((a) => a.status === "PUBLISHED").length,
      drafts: this.articles.filter((a) => a.status === "DRAFT").length,
      pending: this.articles.filter((a) => a.status === "AI_PENDING" || a.status === "PENDING").length,
    };
  }
}

const globalForMemoryDb = global as unknown as { memoryDb: InMemoryDb };
export const memoryDb = globalForMemoryDb.memoryDb || new InMemoryDb();
if (process.env.NODE_ENV !== "production") globalForMemoryDb.memoryDb = memoryDb;

// Check if database URL is valid
export const isDbConfigured = () => {
  return (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("ep-sample-123456")
  );
};
