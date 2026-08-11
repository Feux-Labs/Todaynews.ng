import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

const DEFAULT_SETTINGS = {
  defaultAuthorName: "Gideon Ibitoye",
  defaultAuthorEmail: "editor@todaynews.ng",
  defaultAuthorBio:
    "Chief Editor and Reviewing Authority at Todaynews.ng, specializing in Nigerian political affairs, parallel currency trends, and national policy analysis.",
  siteName: "Todaynews.ng",
  siteTagline: "Breaking Nigerian News, Politics, Naira Rates & Gist",
  contactEmail: "editor@todaynews.ng",
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error("[Settings] Failed to read settings.json:", err);
  }
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(data: Record<string, string>) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Settings] Failed to write settings.json:", err);
    return false;
  }
}

export async function GET() {
  try {
    const settings = readSettings();
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[Settings GET Error]:", err);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = readSettings();
    const merged = { ...current, ...body };
    const ok = writeSettings(merged);
    if (!ok) {
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
    return NextResponse.json({ success: true, settings: merged });
  } catch (err) {
    console.error("[Settings POST Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Helper to read settings from other server-side code (e.g., AI chat route)
 */
export function getServerSettings() {
  return readSettings();
}
