import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (isDbConfigured()) {
      await prisma.subscriber.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    } else {
      await memoryDb.addSubscriber(email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
