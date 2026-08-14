"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  FileCheck,
  Newspaper,
  Flame,
  X,
} from "lucide-react";

export default function AgentPanel() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(true);
  const [customPrompt, setCustomPrompt] = useState("");

  // Dismiss message after 6 seconds
  useEffect(() => {
    if (resultMessage) {
      const timer = setTimeout(() => setResultMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [resultMessage]);

  const handleAction = async (action: string, payload: any = {}) => {
    setLoading(true);
    setResultMessage(null);
    try {
      if (action === "trigger_cron_scrape") {
        const res = await fetch("/api/cron/scrape");
        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
          setResultMessage(`✅ Scraped & enriched ${data.count || 0} stories. Auto-published ${data.autoPublished || 0}.`);
          router.refresh();
        } else {
          setIsSuccess(false);
          setResultMessage(`❌ ${data.error || "Scraper cron failed"}`);
        }
      } else if (action === "trigger_auto_publish") {
        const res = await fetch("/api/cron/auto-publish");
        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
          setResultMessage(`✅ Published ${data.publishedScheduled || 0} scheduled & ${data.autoPublishedPending || 0} pending articles.`);
          router.refresh();
        } else {
          setIsSuccess(false);
          setResultMessage(`❌ ${data.error || "Auto-publish failed"}`);
        }
      } else {
        const res = await fetch("/api/admin/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, payload }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsSuccess(true);
          if (action === "auto_hunt_and_publish") {
            setResultMessage(`✅ Agent hunted & prepared ${data.processedCount || 0} stories!`);
          } else if (action === "bulk_process_inbox") {
            setResultMessage(`✅ Agent paraphrased ${data.count || 0} inbox articles!`);
          } else if (action === "generate_social_blurb") {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(data.blurb);
              setResultMessage("✅ WhatsApp/Social blurb generated and copied to clipboard!");
            } else {
              setResultMessage(`✅ Blurb generated:\n${data.blurb}`);
            }
          } else {
            setResultMessage("✅ Action completed successfully by Todaynews AI Agent!");
          }
          router.refresh();
        } else {
          setIsSuccess(false);
          setResultMessage(`❌ ${data.error || "Agent action failed"}`);
        }
      }
    } catch (err: any) {
      setIsSuccess(false);
      setResultMessage(`❌ Error: ${err.message || "Failed to execute agent action"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    const prompt = customPrompt.trim().toLowerCase();
    setCustomPrompt("");

    if (prompt.includes("publish") || prompt.includes("auto publish")) {
      await handleAction("trigger_auto_publish");
    } else if (prompt.includes("scrape") || prompt.includes("hunt") || prompt.includes("fetch")) {
      await handleAction("auto_hunt_and_publish", { limit: 3, autoPublish: prompt.includes("publish") });
    } else if (prompt.includes("bulk") || prompt.includes("inbox")) {
      await handleAction("bulk_process_inbox", { limit: 5, autoPublish: prompt.includes("publish") });
    } else {
      router.push(`/ng-admin/chat?q=${encodeURIComponent(prompt)}`);
      setIsOpen(false);
    }
  };

  const isInbox = pathname?.includes("/inbox");
  const isDashboard = pathname?.includes("/dashboard");
  const isEditor = pathname?.includes("/editor");
  const isPublished = pathname?.includes("/published");
  const isDrafts = pathname?.includes("/drafts");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Notification Toast */}
      {resultMessage && (
        <div
          className={`mb-3 max-w-sm rounded-xl p-3.5 shadow-2xl border text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 ${
            isSuccess
              ? "bg-[#041a11] border-[#00e676]/40 text-emerald-200 shadow-[#00e676]/10"
              : "bg-[#1c0808] border-red-500/40 text-red-200 shadow-red-500/10"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-[#00e676] flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 whitespace-pre-wrap">{resultMessage}</div>
          <button
            onClick={() => setResultMessage(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Agent Panel */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[400px] bg-[#0b1329]/95 backdrop-blur-xl border border-[#00e676]/30 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-[#00e676]/15 via-emerald-950/40 to-transparent border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center shadow-lg shadow-[#00e676]/20">
                <Bot className="w-4 h-4 text-[#00e676]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Todaynews AI Agent
                  <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Autonomous Editorial Engine
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Container */}
          <div className="p-3.5 space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#00e676]" />
              {isInbox
                ? "Inbox Agent Actions"
                : isDashboard
                ? "Dashboard Agent Actions"
                : isEditor
                ? "Editor Agent Actions"
                : isPublished
                ? "Published News Agent"
                : "Active Agent Capabilities"}
            </div>

            {/* Dynamic context buttons */}
            <div className="grid grid-cols-1 gap-2">
              {/* Context Action 1: Auto Hunt & Paraphrase */}
              <button
                onClick={() => handleAction("auto_hunt_and_publish", { limit: 3, autoPublish: false })}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-[#00e676]/10 border border-white/10 hover:border-[#00e676]/40 text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#00e676]/10 text-[#00e676] flex items-center justify-center group-hover:scale-110 transition">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Auto-Hunt 3 Top Trending Stories
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Scrape, rewrite & save ready drafts
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#00e676] px-1.5 py-0.5 rounded bg-[#00e676]/10">
                  Hunt
                </span>
              </button>

              {/* Context Action 2: Bulk Inbox Rewrite */}
              <button
                onClick={() => handleAction("bulk_process_inbox", { limit: 5, autoPublish: false })}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Bulk Paraphrase AI_PENDING
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Rewrite top 5 inbox queue items
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10">
                  Bulk
                </span>
              </button>

              {/* Context Action 3: Trigger 30-min Auto Scraper Cron */}
              <button
                onClick={() => handleAction("trigger_cron_scrape")}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Run 30-Min Auto-Scraper Cycle
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Instant RSS scan & competitor link clean
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                  Run
                </span>
              </button>

              {/* Context Action 4: Auto-Publish Scheduled / Pending */}
              <button
                onClick={() => handleAction("trigger_auto_publish")}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/40 text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Auto-Publish Pending Articles
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Promote mature AI_PENDING items to live
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10">
                  Publish
                </span>
              </button>
            </div>
          </div>

          {/* Quick Command Input */}
          <form
            onSubmit={handleCustomSubmit}
            className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Tell agent to hunt, publish, or rewrite..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e676]/50"
            />
            <button
              type="submit"
              disabled={loading || !customPrompt.trim()}
              className="p-2 rounded-xl bg-[#00e676] text-black font-bold hover:bg-[#00e676]/90 disabled:opacity-40 transition shadow-lg shadow-[#00e676]/20"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#041a11] hover:bg-[#062619] border border-[#00e676]/40 hover:border-[#00e676] shadow-xl shadow-black/80 hover:shadow-[#00e676]/20 transition-all duration-300 transform hover:-translate-y-0.5"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00e676]"></span>
        </span>

        <div className="w-6 h-6 rounded-full bg-[#00e676]/20 flex items-center justify-center text-[#00e676]">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bot className="w-3.5 h-3.5" />
          )}
        </div>

        <span className="text-xs font-bold text-white tracking-wide">
          Todaynews AI
        </span>

        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>
    </div>
  );
}
