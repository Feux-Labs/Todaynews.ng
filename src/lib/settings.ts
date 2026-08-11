import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS = {
  defaultAuthorName: "Gideon Ibitoye",
  defaultAuthorEmail: "editor@todaynews.ng",
  defaultAuthorBio:
    "Chief Editor and Reviewing Authority at Todaynews.ng, specializing in Nigerian political affairs, parallel currency trends, and national policy analysis.",
  siteName: "Todaynews.ng",
  siteTagline: "Breaking Nigerian News, Politics, Naira Rates & Gist",
  contactEmail: "editor@todaynews.ng",
};

export type SiteSettings = typeof DEFAULT_SETTINGS;

/**
 * Read site settings from data/settings.json (server-side only).
 * Falls back to DEFAULT_SETTINGS if file doesn't exist.
 */
export function getServerSettings(): SiteSettings {
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

/**
 * Write site settings to data/settings.json (server-side only).
 */
export function writeServerSettings(data: Partial<SiteSettings>): boolean {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const current = getServerSettings();
    const merged = { ...current, ...data };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Settings] Failed to write settings.json:", err);
    return false;
  }
}
