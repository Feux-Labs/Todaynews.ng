"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User,
  Mail,
  Save,
  CheckCircle,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";

interface SiteSettings {
  defaultAuthorName: string;
  defaultAuthorEmail: string;
  defaultAuthorBio: string;
  siteName: string;
  siteTagline: string;
  contactEmail: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  defaultAuthorName: "Gideon Ibitoye",
  defaultAuthorEmail: "editor@todaynews.ng",
  defaultAuthorBio:
    "Chief Editor and Reviewing Authority at Todaynews.ng, specializing in Nigerian political affairs, parallel currency trends, and national policy analysis.",
  siteName: "Todaynews.ng",
  siteTagline: "Breaking Nigerian News, Politics, Naira Rates & Gist",
  contactEmail: "editor@todaynews.ng",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEFAULT_SETTINGS),
    });
  };

  const update = (key: keyof SiteSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings((prev) => ({ ...prev, [key]: e.target.value }));

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#00e676]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#00e676]" />
            Site Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure default author, site identity, and editorial contact details.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white border border-white/10 rounded-lg hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className="flex items-center gap-2 px-4 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#060b18] text-xs font-bold rounded-lg transition-all shadow-lg shadow-[#00e676]/20 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saved ? "Saved!" : loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-[#00e676]/10 border border-[#00e676]/30 rounded-lg text-[#00e676] text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Settings saved to server! All new AI-scraped articles will use these defaults.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Author Section */}
        <div className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <User className="w-5 h-5 text-[#00e676]" />
            <h2 className="text-base font-bold text-white">Default Author / Byline</h2>
          </div>
          <p className="text-xs text-slate-400">
            This name will be automatically applied to every article scraped, paraphrased, or published through the AI system. You can edit it per-article in the inbox/drafts.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Default Author Name <span className="text-[#00e676]">*</span>
              </label>
              <input
                type="text"
                value={settings.defaultAuthorName}
                onChange={update("defaultAuthorName")}
                placeholder="e.g. Gideon Ibitoye"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Displayed on all article bylines and in structured data for Google News.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Default Author Email
              </label>
              <input
                type="email"
                value={settings.defaultAuthorEmail}
                onChange={update("defaultAuthorEmail")}
                placeholder="editor@todaynews.ng"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Default Author Bio
              </label>
              <textarea
                rows={3}
                value={settings.defaultAuthorBio}
                onChange={update("defaultAuthorBio")}
                placeholder="Brief editorial profile shown below articles..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm resize-none"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="border border-white/5 rounded-lg p-4 bg-white/5 space-y-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Live Preview (Article Byline)</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00e676]/10 border-2 border-[#00e676] flex items-center justify-center text-sm font-black text-[#00e676]">
                {settings.defaultAuthorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white">{settings.defaultAuthorName || "Author Name"}</p>
                  <span className="bg-[#00e676] text-[#060b18] text-[9px] font-bold px-1.5 py-0.5 rounded">Verified Editor</span>
                </div>
                <p className="text-[10px] text-slate-400">{settings.defaultAuthorEmail}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{settings.defaultAuthorBio}</p>
          </div>
        </div>

        {/* Site Identity Section */}
        <div className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-[#00e676]" />
            <h2 className="text-base font-bold text-white">Site Identity</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={update("siteName")}
                placeholder="Todaynews.ng"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Site Tagline</label>
              <input
                type="text"
                value={settings.siteTagline}
                onChange={update("siteTagline")}
                placeholder="Breaking Nigerian News..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Public Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={update("contactEmail")}
                placeholder="editor@todaynews.ng"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 focus:border-[#00e676]/40 transition text-sm"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="border border-[#00e676]/20 rounded-lg p-4 bg-[#00e676]/5 space-y-2">
            <p className="text-[10px] font-bold text-[#00e676] uppercase tracking-wider">💡 How Author Name Works</p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>New AI-scraped articles will use <strong className="text-white">"{settings.defaultAuthorName}"</strong> as default byline.</li>
              <li>You can override the name per-article inside the <strong className="text-white">Inbox</strong> or <strong className="text-white">Drafts</strong> before publishing.</li>
              <li>The author name also appears in <strong className="text-white">Google News JSON-LD schema</strong> for SEO credit.</li>
              <li>Settings are saved <strong className="text-white">server-side</strong> and persist across all devices and deployments.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
