"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Sparkles, Check, X, Edit3, Trash2, Layers, Eye, RefreshCw, AlertCircle } from "lucide-react";

interface PageData {
  pageNumber: number;
  title?: string;
  content: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  imageUrl?: string;
  readTimeMinutes: number;
  createdAt: string;
  pages: PageData[];
}

export default function AdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<"PENDING" | "PUBLISHED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState(true);

  // Ingest form state
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestCategory, setIngestCategory] = useState("POLITICS");
  const [ingestImageUrl, setIngestImageUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Review modal/state
  const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPages, setEditPages] = useState<PageData[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (e) {
      console.error("Failed to fetch articles:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestContent.trim()) return;

    setIngesting(true);
    setFormMsg(null);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawTitle: ingestTitle,
          rawText: ingestContent,
          category: ingestCategory,
          imageUrl: ingestImageUrl || undefined,
        }),
      });

      if (res.ok) {
        setFormMsg({ type: "success", text: "AI Paraphrased draft created as PENDING! check the list." });
        setIngestTitle("");
        setIngestContent("");
        setIngestImageUrl("");
        if (activeTab === "PENDING") {
          fetchArticles();
        } else {
          setActiveTab("PENDING");
        }
      } else {
        setFormMsg({ type: "error", text: "Failed to ingest article." });
      }
    } catch (err) {
      setFormMsg({ type: "error", text: "Error connecting to AI backend." });
    } finally {
      setIngesting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "PUBLISHED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete article:", e);
    }
  };

  const startReview = (art: Article) => {
    setReviewingArticle(art);
    setEditTitle(art.title);
    setEditSummary(art.summary);
    setEditCategory(art.category);
    setEditPages([...art.pages]);
  };

  const handleEditPageContent = (idx: number, content: string) => {
    const updated = [...editPages];
    updated[idx] = { ...updated[idx], content };
    setEditPages(updated);
  };

  const handleEditPageTitle = (idx: number, title: string) => {
    const updated = [...editPages];
    updated[idx] = { ...updated[idx], title };
    setEditPages(updated);
  };

  const saveEdits = async () => {
    if (!reviewingArticle) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/articles/${reviewingArticle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          category: editCategory,
          pages: editPages,
        }),
      });

      if (res.ok) {
        setReviewingArticle(null);
        fetchArticles();
      }
    } catch (e) {
      console.error("Failed to save edits:", e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 font-body">
      {/* Page Header */}
      <div className="border-b-4 border-ink pb-4">
        <span className="bg-punchRed text-paper text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded font-mono">
          Control Panel
        </span>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase mt-1">
          Todaynews Editor Portal
        </h1>
        <p className="text-xs text-muted mt-2">
          Ingest new source text, split listicles, review AI drafts, and publish to the live site.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Ingest Box */}
        <div className="lg:col-span-1">
          <div className="border-2 border-ink p-5 bg-white rounded shadow-md sticky top-6">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-ink border-b-2 border-ink pb-2 mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-flag animate-pulse" />
              <span>Simulate AI News Ingest</span>
            </h3>

            {formMsg && (
              <div
                className={`p-3 rounded text-xs font-bold border mb-4 flex items-start gap-1.5 ${
                  formMsg.type === "success"
                    ? "bg-flag/10 text-flag border-flag/20"
                    : "bg-signal/10 text-signal border-signal/20"
                }`}
              >
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleIngest} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[10px] uppercase text-muted tracking-wider mb-1">
                  Source Article Title
                </label>
                <input
                  type="text"
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="e.g. CBN releases new rules for cash deposits"
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink outline-none focus:border-flag"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted tracking-wider mb-1">
                  Raw Content / Story Text
                </label>
                <textarea
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="Paste raw paragraphs or details here..."
                  rows={8}
                  required
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink outline-none focus:border-flag font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted tracking-wider mb-1">
                  Category Target
                </label>
                <select
                  value={ingestCategory}
                  onChange={(e) => setIngestCategory(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink outline-none focus:border-flag font-bold"
                >
                  <option value="POLITICS">Politics</option>
                  <option value="NAIRA">Naira Watch</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="SPORTS">Sports</option>
                  <option value="SECURITY">Security</option>
                  <option value="METRO">Metro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted tracking-wider mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={ingestImageUrl}
                  onChange={(e) => setIngestImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink outline-none focus:border-flag"
                />
              </div>

              <button
                type="submit"
                disabled={ingesting}
                className="w-full bg-flag hover:bg-flag/90 border-2 border-flag text-paper py-2.5 rounded font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                {ingesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing AI Paraphrase...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 fill-current text-hazard" />
                    <span>Paraphrase & Split Draft</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Center/Right Column: Ingest Queue Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Filter */}
          <div className="flex border-b-2 border-ink font-bold text-xs">
            {(["PENDING", "PUBLISHED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-t-2 border-l-2 border-r-2 border-transparent uppercase tracking-wider rounded-t -mb-[2px] transition-colors ${
                  activeTab === tab
                    ? "bg-white border-ink text-flag font-black"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab} Queue ({activeTab === tab ? articles.length : "*"})
              </button>
            ))}
          </div>

          {/* Queue Feed */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-ink/10 rounded">
              <RefreshCw className="h-8 w-8 text-flag animate-spin mb-2" />
              <span className="text-xs font-bold text-muted uppercase">Loading Queue...</span>
            </div>
          ) : articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="bg-white border-2 border-ink p-5 rounded shadow-sm hover:shadow transition-all group flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-flag text-paper text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded font-mono">
                        {art.category}
                      </span>
                      <span className="text-[9px] text-muted font-bold">
                        📄 {art.pages?.length || 1} Pages
                      </span>
                    </div>

                    <h4 className="font-display font-black text-base text-ink line-clamp-2 leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-muted mt-2 line-clamp-2 font-medium">
                      {art.summary}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-ink/10 pt-3 md:pt-0 md:pl-4">
                    <button
                      onClick={() => startReview(art)}
                      className="flex items-center gap-1 px-3 py-1.5 border-2 border-ink rounded font-black text-[10px] uppercase hover:bg-ink hover:text-paper transition-all"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Review</span>
                    </button>

                    {art.status !== "PUBLISHED" && (
                      <button
                        onClick={() => handleStatusChange(art.id, "PUBLISHED")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-flag/10 hover:bg-flag border-2 border-flag rounded font-black text-[10px] uppercase text-flag hover:text-paper transition-all"
                      >
                        <Check className="h-3 w-3" />
                        <span>Publish</span>
                      </button>
                    )}

                    {art.status !== "REJECTED" && (
                      <button
                        onClick={() => handleStatusChange(art.id, "REJECTED")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-signal/10 hover:bg-signal border-2 border-signal rounded font-black text-[10px] uppercase text-signal hover:text-paper transition-all"
                      >
                        <X className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(art.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-ink/5 hover:bg-punchRed border-2 border-ink/10 hover:border-punchRed rounded font-black text-[10px] uppercase text-muted hover:text-paper transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white border border-ink/10 rounded">
              <Layers className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-muted uppercase">
                No articles in {activeTab} queue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review & Edit Pages Drawer Modal */}
      {reviewingArticle && (
        <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-paper border-4 border-ink w-full max-w-4xl rounded-lg shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto font-body">
            
            <div className="flex items-center justify-between border-b-2 border-ink pb-3">
              <h3 className="font-display font-black text-lg md:text-xl uppercase text-ink flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-flag" />
                <span>Review & Copy-Edit Pages</span>
              </h3>
              <button
                onClick={() => setReviewingArticle(null)}
                className="text-muted hover:text-ink font-black text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-black text-muted tracking-wider mb-1">
                  Paraphrased Article Title (High-CTR)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink text-sm outline-none focus:border-flag font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black text-muted tracking-wider mb-1">
                  Meta Description / Excerpt
                </label>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink text-xs outline-none focus:border-flag font-medium leading-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-black text-muted tracking-wider mb-1">
                    Category Tag
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-ink rounded bg-white text-ink text-xs outline-none focus:border-flag font-bold"
                  >
                    <option value="POLITICS">Politics</option>
                    <option value="NAIRA">Naira Watch</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="SPORTS">Sports</option>
                    <option value="SECURITY">Security</option>
                    <option value="METRO">Metro</option>
                  </select>
                </div>
              </div>

              {/* Multi-page editor list */}
              <div className="space-y-6 pt-4 border-t border-ink/10">
                <h4 className="text-xs uppercase font-black tracking-widest text-flag font-mono">
                  Paginated Content Blocks
                </h4>

                {editPages.map((page, idx) => (
                  <div key={idx} className="bg-white border-2 border-ink p-4 rounded space-y-3">
                    <div className="flex items-center justify-between border-b border-ink/10 pb-2">
                      <span className="bg-ink text-paper text-[10px] font-black px-2 py-0.5 rounded font-mono">
                        Page {page.pageNumber}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-black text-muted tracking-wider mb-1">
                        Page Headline/Subtitle (Optional)
                      </label>
                      <input
                        type="text"
                        value={page.title || ""}
                        onChange={(e) => handleEditPageTitle(idx, e.target.value)}
                        placeholder={`Subheading for Page ${page.pageNumber}`}
                        className="w-full px-2 py-1.5 border border-ink/20 rounded bg-white text-ink text-xs outline-none focus:border-flag font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-black text-muted tracking-wider mb-1">
                        Page Content (HTML/Paragraphs)
                      </label>
                      <textarea
                        value={page.content}
                        onChange={(e) => handleEditPageContent(idx, e.target.value)}
                        rows={6}
                        className="w-full px-2 py-1.5 border border-ink/20 rounded bg-white text-ink text-xs outline-none focus:border-flag font-medium font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t-2 border-ink/10 pt-4">
              <button
                onClick={() => setReviewingArticle(null)}
                className="px-4 py-2 border-2 border-ink rounded font-black text-xs uppercase hover:bg-ink hover:text-paper transition-all"
              >
                Close
              </button>
              <button
                onClick={saveEdits}
                disabled={updating}
                className="bg-flag hover:bg-flag/90 border-2 border-flag text-paper px-5 py-2 rounded font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow"
              >
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
