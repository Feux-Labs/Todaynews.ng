import path from "path";
import { isDbConfigured, prisma } from "./db";

const SETTINGS_FILE = path.join(process.cwd(), "data", "settings.json");

export const DEFAULT_SETTINGS = {
  defaultAuthorName: "TodaynewsAi",
  defaultAuthorEmail: "editor@todaynews.ng",
  defaultAuthorBio:
    "AI Editorial System at Todaynews.ng, drafting and reviewing stories on Nigerian political affairs, parallel currency trends, and national policy analysis.",
  siteName: "Todaynews.ng",
  siteTagline: "Breaking Nigerian News, Politics, Naira Rates & Gist",
  contactEmail: "editor@todaynews.ng",
};

export type SiteSettings = typeof DEFAULT_SETTINGS;

// In-memory fallback for read-only environments (Vercel, serverless, etc.)
let memorySettings: SiteSettings | null = null;

/**
 * Read site settings. Tries data/settings.json first, falls back to in-memory,
 * then DEFAULT_SETTINGS.
 */
export function getServerSettings(): SiteSettings {
  // In-memory override takes highest priority (set by a successful write this session)
  if (memorySettings) {
    return { ...memorySettings };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<SiteSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Filesystem unavailable — silently fall through
  }
  return { ...DEFAULT_SETTINGS };
}

export async function getPersistentServerSettings(): Promise<SiteSettings> {
  if (!isDbConfigured()) return getServerSettings();

  try {
    const row = await (prisma as any).siteSettings.findUnique({
      where: { id: "singleton" },
    });
    if (!row) return getServerSettings();

    return {
      defaultAuthorName: row.defaultAuthorName,
      defaultAuthorEmail: row.defaultAuthorEmail,
      defaultAuthorBio: row.defaultAuthorBio,
      siteName: row.siteName,
      siteTagline: row.siteTagline,
      contactEmail: row.contactEmail,
    };
  } catch (err) {
    console.error("[Settings] Database read failed; using fallback settings.", err);
    return getServerSettings();
  }
}

/**
 * Write site settings. Tries data/settings.json; if the filesystem is
 * read-only (e.g. Vercel) it falls back to the in-memory store so that
 * settings still work for the lifetime of the process and the UI succeeds.
 */
export function writeServerSettings(data: Partial<SiteSettings>): boolean {
  const current = getServerSettings();
  const merged: SiteSettings = { ...current, ...data };

  // Always update the memory store first
  memorySettings = merged;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs") as typeof import("fs");
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
  } catch {
    // Read-only filesystem — in-memory fallback already applied above, so
    // we still return true so the API can report success to the browser.
    console.info("[Settings] Filesystem write skipped (read-only env); using in-memory store.");
  }

  return true;
}

export async function writePersistentServerSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const merged: SiteSettings = { ...DEFAULT_SETTINGS, ...getServerSettings(), ...data };

  if (isDbConfigured()) {
    try {
      const saved = await (prisma as any).siteSettings.upsert({
        where: { id: "singleton" },
        update: merged,
        create: { id: "singleton", ...merged },
      });

      memorySettings = {
        defaultAuthorName: saved.defaultAuthorName,
        defaultAuthorEmail: saved.defaultAuthorEmail,
        defaultAuthorBio: saved.defaultAuthorBio,
        siteName: saved.siteName,
        siteTagline: saved.siteTagline,
        contactEmail: saved.contactEmail,
      };
      return { ...memorySettings };
    } catch (err) {
      console.error("[Settings] Database write failed; using fallback settings store.", err);
    }
  }

  const ok = writeServerSettings(merged);
  if (!ok) throw new Error("Failed to save settings.");
  return getServerSettings();
}
