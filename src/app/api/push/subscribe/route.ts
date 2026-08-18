import { NextResponse } from "next/server";
import { prisma, isDbConfigured } from "@/lib/db";

export async function POST(req: Request) {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({ error: "Push subscriptions are temporarily unavailable." }, { status: 503 });
    }

    const body = await req.json();
    const { endpoint, keys } = body?.subscription || body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload." }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Push Subscribe] Failed:", err);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }
}
