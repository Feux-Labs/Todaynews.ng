import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured, prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      const ad = await prisma.sponsoredAd.findUnique({
        where: { id: params.id },
      });

      if (!ad) {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }

      return NextResponse.json(ad);
    }
  } catch (err) {
    console.error("Failed to fetch sponsored ad:", err);
    return NextResponse.json({ error: "Failed to fetch ad" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, sponsor, imageUrl, targetUrl, category, badgeText, active } =
      body;

    if (isDbConfigured()) {
      const ad = await prisma.sponsoredAd.update({
        where: { id: params.id },
        data: {
          ...(title && { title }),
          ...(sponsor && { sponsor }),
          ...(imageUrl && { imageUrl }),
          ...(targetUrl && { targetUrl }),
          ...(category && { category }),
          ...(badgeText && { badgeText }),
          ...(typeof active === "boolean" && { active }),
        },
      });

      return NextResponse.json(ad);
    }
  } catch (err) {
    console.error("Failed to update sponsored ad:", err);
    return NextResponse.json(
      { error: "Failed to update ad" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (isDbConfigured()) {
      await prisma.sponsoredAd.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("Failed to delete sponsored ad:", err);
    return NextResponse.json(
      { error: "Failed to delete ad" },
      { status: 500 }
    );
  }
}
