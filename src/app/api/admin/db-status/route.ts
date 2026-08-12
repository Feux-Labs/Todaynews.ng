import { NextResponse } from "next/server";
import { isDbConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * DB Status diagnostic endpoint.
 * GET /api/admin/db-status — Returns database connectivity status,
 * environment variable presence, and a test article count.
 * Used to diagnose why published articles don't appear on the live site.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const dbUrlPresent = !!dbUrl;
  const dbUrlIsSample = dbUrl?.includes("ep-sample-123456") ?? false;
  const dbConfigured = isDbConfigured();

  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    dbUrlPresent,
    dbUrlIsSample,
    dbUrlPrefix: dbUrl ? dbUrl.substring(0, 30) + "…" : null,
    dbConfigured,
    dbTest: null,
    articleCounts: null,
    error: null,
  };

  if (dbConfigured) {
    try {
      // Test query: count articles by status
      const [published, draft, total] = await Promise.all([
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.article.count({ where: { status: "DRAFT" } }),
        prisma.article.count(),
      ]);
      result.dbTest = "connected";
      result.articleCounts = { published, draft, total };
    } catch (err: any) {
      result.dbTest = "failed";
      result.error = err?.message || String(err);
    }
  } else {
    result.dbTest = "skipped_not_configured";
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
