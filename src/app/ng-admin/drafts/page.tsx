"use client";

import { useEffect, useState } from "react";
import {
  FileEdit,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Clock,
  Tag,
  Rocket,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Maximize2,
} from "lucide-react";

interface ArticlePage {
  pageNumber: number;
  title?: string | null;
  content: string;
}

interface DraftArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl?: string;
  author?: string;
  status?: "DRAFT" | "SCHEDULED";
  scheduledAt?: string | null;
  createdAt: string;
  pages: ArticlePage[];
}

const CATEGORIES = [
  "POLITICS", "NAIRA", "ENTERTAINMENT", "SPORTS",
  "SECURITY", "METRO", "EDUCATION", "TECHNOLOGY", "HEALTH",
];

export default function DraftsPage() {
  const [articles, setArticles] = useState<DraftArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<DraftArticle | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editPages, setEditPages] = useState<ArticlePage[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editScheduledAt, setEditScheduledAt] = useState("");

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?status=DRAFT,SCHEDULED");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || data);
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  const publishArticle = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Publish failed:", err);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Delete this draft permanently?")) return;
    try {
      await fetch(`/api/articles/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const openEditor = (article: DraftArticle) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditSummary(article.summary);
    setEditCategory(article.category);
    setEditAuthor((article as any).author || "");
    setEditScheduledAt(article.scheduledAt ? article.scheduledAt.slice(0, 16) : "");
    setEditPages(
      article.pages.length > 0
        ? [...article.pages]
        : [{ pageNumber: 1, title: "Introduction", content: "" }]
    );
    setActivePageIdx(0);
  };

  const closeEditor = () => {
    setEditingArticle(null);
    setEditPages([]);
  };

  const updatePageContent = (idx: number, field: "title" | "content", value: string) => {
    setEditPages((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addPage = () => {
    const newPage: ArticlePage = {
      pageNumber: editPages.length + 1,
      title: `Part ${editPages.length + 1}`,
      content: "",
    };
    setEditPages((prev) => [...prev, newPage]);
    setActivePageIdx(editPages.length);
  };

  const removePage = (idx: number) => {
    if (editPages.length <= 1) return;
    const updated = editPages
      .filter((_, i) => i !== idx)
      .map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setEditPages(updated);
    setActivePageIdx(Math.min(activePageIdx, updated.length - 1));
  };

  const saveFullEdit = async (targetStatus: "DRAFT" | "PUBLISHED" = "DRAFT", scheduledAt?: string) => {
    if (!editingArticle) return;
    if (scheduledAt && new Date(scheduledAt).getTime() <= Date.now()) {
      alert("Choose a future date and time for scheduled publishing.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/articles/${editingArticle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          summary: editSummary,
          category: editCategory,
          author: editAuthor,
          status: targetStatus,
          scheduledAt,
          pages: editPages,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setArticles((prev) =>
          prev.map((a) =>
            a.id === editingArticle.id
              ? {
                  ...a,
                  title: editTitle,
                  summary: editSummary,
                  category: editCategory,
                  pages: editPages,
                }
              : a
          )
        );
        closeEditor();
        if (targetStatus === "PUBLISHED") {
          await fetchDrafts();
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-[#aa00ff]" />
            Drafts
            {articles.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-[#aa00ff]/10 text-[#aa00ff] text-sm font-bold rounded-full">
                {articles.length}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Approved articles ready for editing and publishing</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#00e676]" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <FileEdit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No drafts</p>
            <p className="text-slate-500 text-sm mt-1">Approve stories from the Inbox to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
              >
                <div className="flex gap-4">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white leading-tight">{article.title}</h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{article.summary}</p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] px-2 py-0.5 bg-[#aa00ff]/10 text-[#aa00ff] rounded-full font-medium">
                        <Tag className="w-3 h-3 inline mr-1" />{article.category}
                      </span>
                      {article.status === "SCHEDULED" && article.scheduledAt && (
                        <span className="text-[10px] text-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Scheduled {new Date(article.scheduledAt).toLocaleString("en-NG")}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {article.pages?.length || 0} page{article.pages?.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(article.createdAt).toLocaleDateString("en-NG")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <button
                    onClick={() => openEditor(article)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-300 text-xs font-medium rounded-md hover:bg-white/10 transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Edit Content
                  </button>
                  <button
                    onClick={() => publishArticle(article.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00e676]/10 text-[#00e676] text-xs font-bold rounded-md hover:bg-[#00e676]/20 transition"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Publish Now
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-500/60 text-xs rounded-md hover:bg-red-500/10 transition ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Content Editor Modal */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          {/* Modal Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-[#0a0f1c] shrink-0">
            <div className="flex items-center gap-3">
              <FileEdit className="w-5 h-5 text-[#aa00ff]" />
              <span className="text-white font-semibold text-sm truncate max-w-md">{editTitle || "Untitled Draft"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveFullEdit("DRAFT")}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-[#060b18] text-xs font-bold rounded-lg transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => saveFullEdit("PUBLISHED")}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 transition disabled:opacity-60"
              >
                <Rocket className="w-3.5 h-3.5" />
                Publish
              </button>
              <button
                onClick={closeEditor}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel — Metadata */}
            <div className="w-72 shrink-0 border-r border-white/5 bg-[#0a0f1c] overflow-y-auto p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Article Metadata</h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Headline</label>
                  <textarea
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    rows={2}
                    className="w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Meta Summary</label>
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#1a2336] border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Author / Byline</label>
                  <input
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30"
                  />
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Schedule Publish</label>
                  <input
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30"
                  />
                  <button
                    onClick={() => saveFullEdit("PUBLISHED", editScheduledAt)}
                    disabled={saving || !editScheduledAt}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Schedule Article
                  </button>
                </div>
              </div>

              {/* Pages Navigator */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pages ({editPages.length})</h3>
                  <button
                    onClick={addPage}
                    className="flex items-center gap-1 text-[10px] text-[#aa00ff] hover:text-purple-300 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Page
                  </button>
                </div>

                <div className="space-y-1">
                  {editPages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePageIdx(idx)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center justify-between group ${
                        activePageIdx === idx
                          ? "bg-[#aa00ff]/15 text-purple-300 border border-[#aa00ff]/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="truncate">
                        <span className="font-mono text-[9px] mr-1.5 opacity-60">P{idx + 1}</span>
                        {page.title || "Untitled"}
                      </span>
                      {editPages.length > 1 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition ml-1"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel — Content Editor */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#060b18]">
              {editPages[activePageIdx] && (
                <>
                  {/* Page header */}
                  <div className="px-6 py-3 border-b border-white/5 bg-[#0a0f1c] shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-500">Page {activePageIdx + 1} Title</span>
                    </div>
                    <input
                      value={editPages[activePageIdx].title || ""}
                      onChange={(e) => updatePageContent(activePageIdx, "title", e.target.value)}
                      placeholder="Page section title..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30"
                    />
                  </div>

                  {/* Content area */}
                  <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500">HTML Content (Page {activePageIdx + 1})</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePageIdx((i) => Math.max(0, i - 1))}
                          disabled={activePageIdx === 0}
                          className="p-1 rounded bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">{activePageIdx + 1}/{editPages.length}</span>
                        <button
                          onClick={() => setActivePageIdx((i) => Math.min(editPages.length - 1, i + 1))}
                          disabled={activePageIdx === editPages.length - 1}
                          className="p-1 rounded bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={editPages[activePageIdx].content}
                      onChange={(e) => updatePageContent(activePageIdx, "content", e.target.value)}
                      placeholder='<p class="mb-4">Start writing content here... Use HTML tags for formatting.</p>'
                      className="flex-1 w-full px-4 py-3 bg-[#0a0f1c] border border-white/5 rounded-xl text-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#aa00ff]/30 resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-600 mt-2">
                      Use HTML tags: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h3&gt;, &lt;blockquote&gt;, &lt;div class="..."&gt;
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
