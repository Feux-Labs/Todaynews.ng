"use client";

import { useEffect, useState } from "react";
import {
  FileEdit,
  Send,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Clock,
  Tag,
  Rocket,
  Eye,
} from "lucide-react";

interface DraftArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
  pages: { pageNumber: number; title?: string; content: string }[];
}

export default function DraftsPage() {
  const [articles, setArticles] = useState<DraftArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?status=DRAFT");
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
    try {
      await fetch(`/api/articles/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const startEdit = (article: DraftArticle) => {
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

  return (
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
        <p className="text-slate-400 text-sm mt-1">Approved articles ready for publishing</p>
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
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-white/5 text-slate-400 text-xs rounded-md">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-white leading-tight">{article.title}</h3>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{article.summary}</p>
                    </>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-[#aa00ff]/10 text-[#aa00ff] rounded-full font-medium">
                      <Tag className="w-3 h-3 inline mr-1" />{article.category}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {article.pages?.length || 0} pages
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
                    <FileEdit className="w-3.5 h-3.5" /> Edit Draft
                  </button>
                  <button onClick={() => publishArticle(article.id)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00e676]/10 text-[#00e676] text-xs font-bold rounded-md hover:bg-[#00e676]/20 transition">
                    <Rocket className="w-3.5 h-3.5" /> Publish Now
                  </button>
                  <button onClick={() => deleteArticle(article.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/5 text-red-500/60 text-xs rounded-md hover:bg-red-500/10 transition ml-auto">
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
