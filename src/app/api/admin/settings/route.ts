import { NextResponse } from "next/server";
import { getPersistentServerSettings, writePersistentServerSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPersistentServerSettings();
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[Settings GET Error]:", err);
    return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await writePersistentServerSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error("[Settings POST Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
