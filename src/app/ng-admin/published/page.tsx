"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  FileEdit,
  RotateCcw,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Clock,
  Tag,
  Eye,
  ExternalLink,
  Search,
  Camera,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

interface PublishedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  views: number;
  imageUrl?: string;
  createdAt: string;
  pages: { pageNumber: number; title?: string; content: string }[];
}

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

export default function PublishedPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Modal State for Image Picker
  const [imageModalArticle, setImageModalArticle] = useState<PublishedArticle | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    fetchPublished();
  }, []);

  const fetchPublished = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?status=PUBLISHED");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || data);
      }
    } catch (err) {
      console.error("Failed to fetch published articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const unpublishArticle = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT" }),
      });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Unpublish failed:", err);
    }
  };

  const deleteArticle = async (id: string, slug?: string) => {
    if (!confirm("Are you sure you want to permanently delete this live article?")) return;
    try {
      await fetch(`/api/articles/${id || slug}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id && a.slug !== (slug || id)));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const deleteAllArticles = async () => {
    if (!confirm("WARNING: This will permanently delete ALL published articles on the site. Proceed?")) return;
    try {
      for (const a of articles) {
        await fetch(`/api/articles/${a.id || a.slug}`, { method: "DELETE" });
      }
      setArticles([]);
    } catch (err) {
      console.error("Bulk delete failed:", err);
    }
  };

  const startEdit = (article: PublishedArticle) => {
    setEditingId(article.id);
    setEditTitle(article.title);
    setEditSummary(article.summary);
    setEditImageUrl(article.imageUrl || "");
  };

  const saveEdit = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, summary: editSummary, imageUrl: editImageUrl }),
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title: editTitle, summary: editSummary, imageUrl: editImageUrl } : a))
      );
      setEditingId(null);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const openImageModal = (article: PublishedArticle) => {
    setImageModalArticle(article);
    setNewImageUrl(article.imageUrl || "");
  };

  const saveNewImage = async () => {
    if (!imageModalArticle) return;
    setSavingImage(true);
    try {
      await fetch(`/api/articles/${imageModalArticle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: newImageUrl }),
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === imageModalArticle.id ? { ...a, imageUrl: newImageUrl } : a))
      );
      setImageModalArticle(null);
    } catch (err) {
      console.error("Failed to update image:", err);
    } finally {
      setSavingImage(false);
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#00e676]" />
            Published Articles
            {articles.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-[#00e676]/10 text-[#00e676] text-sm font-bold rounded-full">
                {articles.length}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Live articles currently visible to visitors on Todaynews.ng</p>
        </div>

        <div className="flex items-center gap-3">
          {articles.length > 0 && (
            <button
              onClick={deleteAllArticles}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-bold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All ({articles.length})
            </button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live articles..."
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#00e676]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No published articles found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all"
            >
              <div className="flex gap-4">
                {/* Thumbnail with direct Change Image trigger */}
                <div
                  onClick={() => openImageModal(article)}
                  className="group relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-white/10 bg-white/5"
                  title="Click to Change Featured Image"
                >
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition gap-1 text-[10px] text-white font-bold">
                    <Camera className="w-4 h-4 text-[#00e676]" />
                    <span>Change</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {editingId === article.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Article Headline"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                      />
                      <textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        placeholder="Article Summary"
                        rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          value={editImageUrl}
                          onChange={(e) => setEditImageUrl(e.target.value)}
                          placeholder="Featured Image URL (https://...)"
                          className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => openImageModal(article)}
                          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs rounded-lg flex items-center gap-1 font-medium transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#00e676]" /> Preset Library
                        </button>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => saveEdit(article.id)} className="px-3 py-1.5 bg-[#00e676] text-black font-bold text-xs rounded-md hover:bg-[#00e676]/90 transition">
                          Save Changes
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-md hover:bg-white/10 transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-white leading-tight flex items-center gap-2">
                        {article.title}
                        <Link
                          href={`/article/${article.slug}`}
                          target="_blank"
                          className="text-slate-500 hover:text-[#00e676] transition"
                          title="View Live Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                    </>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#00e676]/10 text-[#00e676] rounded-full font-medium">
                      <Tag className="w-3 h-3 inline mr-1" />{article.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Eye className="w-3 h-3 text-[#00e676]" /> {article.views.toLocaleString()} views
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(article.createdAt).toLocaleDateString("en-NG")}
                    </span>
                  </div>
                </div>
              </div>

              {editingId !== article.id && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5 items-center">
                  <button onClick={() => startEdit(article)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-300 text-xs font-medium rounded-md hover:bg-white/10 transition">
                    <FileEdit className="w-3.5 h-3.5" /> Quick Edit
                  </button>
                  <button onClick={() => openImageModal(article)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00e676]/10 text-[#00e676] text-xs font-bold rounded-md hover:bg-[#00e676]/20 transition border border-[#00e676]/20">
                    <Camera className="w-3.5 h-3.5" /> Change Image
                  </button>
                  <Link href={`/ng-admin/editor?id=${article.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-md hover:bg-blue-500/20 transition">
                    <ExternalLink className="w-3.5 h-3.5" /> Open in CMS Editor
                  </Link>
                  <button onClick={() => unpublishArticle(article.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-md hover:bg-amber-500/20 transition">
                    <RotateCcw className="w-3.5 h-3.5" /> Retract / Unpublish
                  </button>
                  <button onClick={() => deleteArticle(article.id, article.slug)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-500/60 text-xs rounded-md hover:bg-red-500/10 transition ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modern Image Picker Modal */}
      {imageModalArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 text-[#00e676] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Change Featured Image</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{imageModalArticle.title}</p>
                </div>
              </div>
              <button
                onClick={() => setImageModalArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Image Preview */}
            <div className="w-full h-44 rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
              {newImageUrl ? (
                <img
                  src={newImageUrl}
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

            {/* Custom URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#00e676]" />
                Image URL (Direct link)
              </label>
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or any web image link"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#00e676]/50 font-mono"
              />
            </div>

            {/* Preset Library */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00e676]" />
                Curated High-Res Nigerian Editorial Presets
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setNewImageUrl(preset.url)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left text-[11px] transition ${
                      newImageUrl === preset.url
                        ? "bg-[#00e676]/15 border-[#00e676] text-white font-semibold"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
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
                onClick={saveNewImage}
                disabled={savingImage || !newImageUrl.trim()}
                className="flex-1 py-2.5 bg-[#00e676] text-black font-bold text-xs rounded-xl hover:bg-[#00e676]/90 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Apply & Save Image
              </button>
              <button
                type="button"
                onClick={() => setImageModalArticle(null)}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-xl transition"
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
