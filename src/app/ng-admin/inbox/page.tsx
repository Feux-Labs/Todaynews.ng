"use client";

import { useEffect, useState } from "react";
import {
  Inbox as InboxIcon,
  Check,
  X,
  FileEdit,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Eye,
  Clock,
  Tag,
  Loader2,
  Search,
  Globe,
  Pencil,
} from "lucide-react";
import Link from "next/link";

interface InboxArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  sourceUrl?: string;
  imageUrl?: string;
  createdAt: string;
  pages: { pageNumber: number; title?: string; content: string }[];
}

export default function InboxPage() {
  const [articles, setArticles] = useState<InboxArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [defaultAuthor, setDefaultAuthor] = useState("TodaynewsAi");
  const [paraphrasingId, setParaphrasingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchInbox();
    // Load default author from admin settings
    try {
      const stored = localStorage.getItem("todaynews_site_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.defaultAuthorName) setDefaultAuthor(parsed.defaultAuthorName);
      }
    } catch {}
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?status=AI_PENDING&limit=100");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || data);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "publish" | "reject" | "delete") => {
    const statusMap = { approve: "DRAFT", publish: "PUBLISHED", reject: "REJECTED", delete: "DELETE" };

    try {
      if (action === "delete") {
        await fetch(`/api/articles/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/articles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusMap[action] }),
        });
      }
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  const handleParaphrase = async (article: InboxArticle) => {
    setParaphrasingId(article.id);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "paraphrase",
          storyId: article.id,
          storyTitle: article.title,
          storySummary: article.summary,
          storyCategory: article.category,
        }),
      });
      if (res.ok) {
        await fetchInbox(); // Refresh
      }
    } catch (err) {
      console.error("Paraphrase failed:", err);
    } finally {
      setParaphrasingId(null);
    }
  };

  const startEdit = (article: InboxArticle) => {
    setEditingId(article.id);
    setEditTitle(article.title);
    setEditSummary(article.summary);
    setEditAuthor((article as any).author || defaultAuthor);
  };

  const saveEdit = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, summary: editSummary, author: editAuthor }),
      });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, title: editTitle, summary: editSummary } : a
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <InboxIcon className="w-6 h-6 text-[#475569]" />
            Inbox
            {articles.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-[#475569]/10 text-[#475569] text-sm font-bold rounded-full">
                {articles.length}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-scraped stories waiting for your review</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 w-64"
          />
        </div>
      </div>

      {/* Stories */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <InboxIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No pending stories in inbox</p>
          <p className="text-slate-500 text-sm mt-1">
            Use the AI Chat to scrape new stories, or wait for the auto-scraper.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 hover:border-slate-200 transition-all"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === article.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Article Headline"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                      />
                      <textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        rows={2}
                        placeholder="Article summary / meta description"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          placeholder="Author / Byline name"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-[#2563eb]/30 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                        />
                        <button
                          onClick={() => setEditAuthor(defaultAuthor)}
                          className="px-2 py-2 text-[10px] text-slate-400 hover:text-[#2563eb] border border-slate-200 rounded-lg transition whitespace-nowrap"
                        >
                          Reset to Default
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(article.id)}
                          className="px-3 py-1.5 bg-[#2563eb]/20 text-[#2563eb] text-xs font-medium rounded-md hover:bg-[#2563eb]/30"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-50 text-slate-400 text-xs font-medium rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-slate-900 leading-tight">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                    </>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded-full font-medium">
                      <Tag className="w-3 h-3 inline mr-1" />
                      {article.category}
                    </span>
                    <span className="text-[10px] text-blue-700/80 flex items-center gap-1 font-mono">
                      <Globe className="w-3 h-3 text-[#2563eb]" /> Todaynews AI
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(article.createdAt).toLocaleString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.pages?.length || 0} pages
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {editingId !== article.id && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Link
                    href={`/ng-admin/editor?id=${article.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/10 text-[#2563eb] text-xs font-bold rounded-md hover:bg-[#2563eb]/20 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit in CMS
                  </Link>
                  <button
                    onClick={() => startEdit(article)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-100 transition"
                  >
                    <FileEdit className="w-3.5 h-3.5" /> Quick Edit
                  </button>
                  <button
                    onClick={() => handleParaphrase(article)}
                    disabled={paraphrasingId === article.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-md hover:bg-blue-500/20 transition disabled:opacity-50"
                  >
                    {paraphrasingId === article.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Re-paraphrase
                  </button>
                  <button
                    onClick={() => handleAction(article.id, "publish")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/15 text-[#2563eb] text-xs font-bold rounded-md hover:bg-[#2563eb]/25 border border-[#2563eb]/30 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> 🚀 Instant Publish
                  </button>
                  <button
                    onClick={() => handleAction(article.id, "approve")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-md hover:bg-amber-500/20 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Move to Drafts
                  </button>
                  <button
                    onClick={() => handleAction(article.id, "reject")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-medium rounded-md hover:bg-red-500/20 transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(article.id, "delete")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-500/60 text-xs font-medium rounded-md hover:bg-red-500/10 transition ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
