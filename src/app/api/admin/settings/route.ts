import { NextResponse } from "next/server";
import { getServerSettings, writeServerSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = getServerSettings();
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[Settings GET Error]:", err);
    return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ok = writeServerSettings(body);
    if (!ok) {
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
    const updated = getServerSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error("[Settings POST Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
