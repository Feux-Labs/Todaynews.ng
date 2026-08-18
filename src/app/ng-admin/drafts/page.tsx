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
  Camera,
  Check,
  Sparkles,
  Link as LinkIcon,
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
  "SCHOLARSHIP", "JAPA", "MAKE_MONEY_ONLINE",
];

const PRESET_IMAGES = [
  { label: "Nigeria Politics / Government", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80" },
  { label: "Naira / Economy & Central Bank", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" },
  { label: "Nigeria Metro & Lagos City", url: "https://images.unsplash.com/photo-1577975882846-431adc8c2009?auto=format&fit=crop&w=1200&q=80" },
  { label: "Security & Law Enforcement", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" },
  { label: "Sports & Football", url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80" },
  { label: "Entertainment & Afrobeats", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80" },
  { label: "Technology & AI", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
  { label: "Scholarships & Study", url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80" },
  { label: "Japa & Visa Relocation", url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80" },
  { label: "Online Business & Fintech", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80" },
];

export default function DraftsPage() {
  const [articles, setArticles] = useState<DraftArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<DraftArticle | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPages, setEditPages] = useState<ArticlePage[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editScheduledAt, setEditScheduledAt] = useState("");

  // Quick Image Modal State
  const [imageModalArticle, setImageModalArticle] = useState<DraftArticle | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [savingModalImage, setSavingModalImage] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?status=DRAFT,SCHEDULED&limit=100");
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
    setEditImageUrl(article.imageUrl || "");
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
          imageUrl: editImageUrl,
          author: editAuthor,
          status: targetStatus,
          scheduledAt,
          pages: editPages,
        }),
      });

      if (res.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === editingArticle.id
              ? {
                  ...a,
                  title: editTitle,
                  summary: editSummary,
                  category: editCategory,
                  imageUrl: editImageUrl,
                  pages: editPages,
                }
              : a
          )
        );
        if (targetStatus === "PUBLISHED" && !scheduledAt) {
          setArticles((prev) => prev.filter((a) => a.id !== editingArticle.id));
        }
        closeEditor();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const openQuickImageModal = (article: DraftArticle) => {
    setImageModalArticle(article);
    setModalImageUrl(article.imageUrl || "");
  };

  const saveQuickModalImage = async () => {
    if (!imageModalArticle) return;
    setSavingModalImage(true);
    try {
      await fetch(`/api/articles/${imageModalArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: modalImageUrl }),
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === imageModalArticle.id ? { ...a, imageUrl: modalImageUrl } : a))
      );
      setImageModalArticle(null);
    } catch (err) {
      console.error("Failed to update draft image:", err);
    } finally {
      setSavingModalImage(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileEdit className="w-6 h-6 text-[#475569]" />
            Drafts & Scheduled Articles
            {articles.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-[#475569]/10 text-[#475569] text-sm font-bold rounded-full">
                {articles.length}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Articles in progress, scheduled queue, or awaiting final review
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#475569]" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20">
          <FileEdit className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No drafts or scheduled articles found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 hover:border-slate-200 transition-all"
            >
              <div className="flex gap-4">
                {/* Thumbnail with Click to Change Image */}
                <div
                  onClick={() => openQuickImageModal(article)}
                  className="group relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-slate-200 bg-slate-50"
                  title="Click to Change Featured Image"
                >
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition gap-1 text-[10px] text-slate-900 font-bold">
                    <Camera className="w-4 h-4 text-[#2563eb]" />
                    <span>Change</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{article.summary}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#475569]/10 text-slate-700 rounded-full font-medium">
                      <Tag className="w-3 h-3 inline mr-1" />
                      {article.category}
                    </span>
                    {article.status === "SCHEDULED" ? (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Scheduled: {article.scheduledAt ? new Date(article.scheduledAt).toLocaleString("en-NG") : "Pending"}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded-full font-medium">
                        Draft
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

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 items-center">
                <button
                  onClick={() => openEditor(article)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-100 transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Edit Content
                </button>
                <button
                  onClick={() => openQuickImageModal(article)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb]/10 text-[#2563eb] text-xs font-bold rounded-md hover:bg-[#2563eb]/20 transition border border-[#2563eb]/20"
                >
                  <Camera className="w-3.5 h-3.5" /> Change Image
                </button>
                <button
                  onClick={() => publishArticle(article.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb]/10 text-[#2563eb] text-xs font-bold rounded-md hover:bg-[#2563eb]/20 transition"
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

      {/* Full Content Editor Modal with Featured Image Section */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col">
          {/* Modal Header */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <FileEdit className="w-5 h-5 text-[#475569]" />
              <span className="text-slate-900 font-semibold text-sm truncate max-w-md">{editTitle || "Untitled Draft"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => saveFullEdit("DRAFT")}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => saveFullEdit("PUBLISHED")}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg border border-[#2563eb] transition disabled:opacity-60"
              >
                <Rocket className="w-3.5 h-3.5" />
                Publish
              </button>
              <button
                onClick={closeEditor}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel — Metadata & Featured Image */}
            <div className="w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Article Metadata</h3>

              <div className="space-y-3">
                {/* Featured Image Box */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Featured Image
                  </label>
                  <div className="w-full h-28 rounded-lg overflow-hidden bg-black/50 border border-slate-200 relative mb-2">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                        No Image Selected
                      </div>
                    )}
                  </div>
                  <input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Image URL (https://...)"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#475569]/30 font-mono mb-2"
                  />
                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1">
                    {PRESET_IMAGES.slice(0, 4).map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => setEditImageUrl(p.url)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                      >
                        {p.label.split("/")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Headline</label>
                  <textarea
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    rows={2}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#475569]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Meta Summary</label>
                  <textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#475569]/30 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none"
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
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#475569]/30"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Schedule Publish</label>
                  <input
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#475569]/30"
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
                    className="flex items-center gap-1 text-[10px] text-[#475569] hover:text-slate-700 transition"
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
                          ? "bg-[#475569]/15 text-slate-700 border border-[#475569]/30"
                          : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate">
                        <span className="font-mono text-[9px] mr-1.5 opacity-60">P{idx + 1}</span>
                        {page.title || "Untitled"}
                      </span>
                      {editPages.length > 1 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); removePage(idx); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel — Multi-Page Article Content Editor */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {editPages[activePageIdx] && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-600">
                      Editing Page {activePageIdx + 1} of {editPages.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActivePageIdx(Math.max(0, activePageIdx - 1))}
                        disabled={activePageIdx === 0}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-900 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActivePageIdx(Math.min(editPages.length - 1, activePageIdx + 1))}
                        disabled={activePageIdx === editPages.length - 1}
                        className="p-1 rounded bg-slate-50 hover:bg-slate-100 disabled:opacity-30 text-slate-400 hover:text-slate-900 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Page Subtitle / Section Header
                    </label>
                    <input
                      value={editPages[activePageIdx].title || ""}
                      onChange={(e) => updatePageContent(activePageIdx, "title", e.target.value)}
                      placeholder="e.g. Background and Key Statements"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#475569]/30"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Page Content (HTML or Plain Text)
                    </label>
                    <textarea
                      value={editPages[activePageIdx].content}
                      onChange={(e) => updatePageContent(activePageIdx, "content", e.target.value)}
                      rows={14}
                      placeholder="Write or edit article content for this page..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#475569]/30 font-mono text-xs leading-relaxed resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Image Picker Modal */}
      {imageModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#475569]/10 text-slate-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Featured Image</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{imageModalArticle.title}</p>
                </div>
              </div>
              <button
                onClick={() => setImageModalArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Preview */}
            <div className="w-full h-44 rounded-xl overflow-hidden bg-black/50 border border-slate-200 relative">
              {modalImageUrl ? (
                <img
                  src={modalImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">No image URL specified</span>
                </div>
              )}
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
                Image URL (Direct link)
              </label>
              <input
                type="text"
                value={modalImageUrl}
                onChange={(e) => setModalImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or direct web link"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder-slate-500 focus:outline-none focus:border-slate-400/50 font-mono"
              />
            </div>

            {/* Preset Library */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                Curated High-Res Nigerian Editorial Presets
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setModalImageUrl(preset.url)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-[11px] transition ${
                      modalImageUrl === preset.url
                        ? "bg-[#475569]/15 border-[#475569] text-slate-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <img src={preset.url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={saveQuickModalImage}
                disabled={savingModalImage || !modalImageUrl.trim()}
                className="flex-1 py-2.5 bg-[#475569] text-slate-900 font-bold text-xs rounded-xl hover:bg-[#475569]/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-slate-400/30"
              >
                {savingModalImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Apply & Save Image
              </button>
              <button
                type="button"
                onClick={() => setImageModalArticle(null)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
