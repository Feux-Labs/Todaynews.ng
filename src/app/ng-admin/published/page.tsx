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

export default function PublishedPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");

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
        body: JSON.stringify({ status: "UNPUBLISHED" }),
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
  };

  const saveEdit = async (id: string) => {
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, summary: editSummary }),
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, title: editTitle, summary: editSummary } : a))
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
              Delete All Published Stories ({articles.length})
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
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {editingId === article.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                      />
                      <textarea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00e676]/30 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(article.id)} className="px-3 py-1.5 bg-[#00e676]/20 text-[#00e676] text-xs font-medium rounded-md">
                          Save Changes
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-md">
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
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <button onClick={() => startEdit(article)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-300 text-xs font-medium rounded-md hover:bg-white/10 transition">
                    <FileEdit className="w-3.5 h-3.5" /> Edit Article
                  </button>
                  <button onClick={() => unpublishArticle(article.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-md hover:bg-amber-500/20 transition">
                    <RotateCcw className="w-3.5 h-3.5" /> Retract / Unpublish
                  </button>
                  <button onClick={() => deleteArticle(article.id, article.slug)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-500/60 text-xs rounded-md hover:bg-red-500/10 transition ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
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
