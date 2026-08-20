import { NextResponse } from "next/server";
import { isDbConfigured, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * One-time cleanup for the fake pageview rows a since-removed bug wrote
 * directly into the database (see src/app/api/analytics/stats/route.ts).
 * There's no reliable way to tell a fabricated row from a real one after
 * the fact, so this wipes all pageview history and resets every article's
 * views to 0 — an honest, if blunt, reset. From this point on, views are
 * counted exactly once per real page load (PageViewBeacon only), so the
 * numbers stay accurate going forward without needing this again.
 */
export async function POST() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "No database configured — nothing to reset." }, { status: 400 });
  }

  try {
    const deletedViews = await (prisma as any).pageView.deleteMany({});
    const resetArticles = await prisma.article.updateMany({
      data: { views: 0 },
    });

    return NextResponse.json({
      success: true,
      deletedPageViews: deletedViews.count,
      resetArticles: resetArticles.count,
    });
  } catch (err) {
    console.error("[Reset Analytics Error]:", err);
    return NextResponse.json({ error: "Failed to reset analytics" }, { status: 500 });
  }
}
