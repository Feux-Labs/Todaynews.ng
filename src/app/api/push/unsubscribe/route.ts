import { NextResponse } from "next/server";
import { prisma, isDbConfigured } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) return NextResponse.json({ success: true });

    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Unsubscribe] Failed:", err);
    return NextResponse.json({ error: "Failed to remove subscription." }, { status: 500 });
  }
}
