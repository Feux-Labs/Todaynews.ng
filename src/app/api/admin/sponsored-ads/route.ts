import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    if (isDbConfigured()) {
      const ads = await prisma.sponsoredAd.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(ads);
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("Failed to fetch sponsored ads:", err);
    return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, sponsor, imageUrl, targetUrl, category, badgeText } = body;

    if (!title || !sponsor || !imageUrl || !targetUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (isDbConfigured()) {
      const ad = await prisma.sponsoredAd.create({
        data: {
          title,
          sponsor,
          imageUrl,
          targetUrl,
          category: category || null,
          badgeText: badgeText || "Sponsored",
        },
      });
      return NextResponse.json(ad, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
  } catch (err) {
    console.error("Failed to create sponsored ad:", err);
    return NextResponse.json(
      { error: "Failed to create ad" },
      { status: 500 }
    );
  }
}
