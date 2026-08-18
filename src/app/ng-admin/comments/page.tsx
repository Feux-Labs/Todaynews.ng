"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Check,
  X,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CommentRecord {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  article: { id: string; title: string; slug: string } | null;
}

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "ALL" },
] as const;

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("PENDING");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [filter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const moderate = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Moderation action failed:", err);
    } finally {
      setActioningId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this comment?")) return;
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setActioningId(null);
    }
  };

  const statusBadge = (status: CommentRecord["status"]) => {
    if (status === "APPROVED")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    if (status === "REJECTED")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#2563eb]" />
            Comments
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Reader comments are held for moderation and only appear publicly once approved.
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 text-xs font-bold transition ${
                filter === f.value ? "bg-[#2563eb] text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-500">No {filter !== "ALL" ? filter.toLowerCase() : ""} comments.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const isActing = actioningId === c.id;
            return (
              <div key={c.id} className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{c.authorName}</span>
                      {c.authorEmail && <span className="text-xs text-slate-400 dark:text-slate-500">{c.authorEmail}</span>}
                      {statusBadge(c.status)}
                    </div>
                    {c.article && (
                      <Link
                        href={`/article/${c.article.slug}`}
                        target="_blank"
                        className="text-xs text-[#2563eb] hover:underline"
                      >
                        On: {c.article.title}
                      </Link>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{c.content}</p>

                <div className="flex items-center gap-2 mt-3">
                  {c.status !== "APPROVED" && (
                    <button
                      onClick={() => moderate(c.id, "APPROVED")}
                      disabled={isActing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                    >
                      {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Approve
                    </button>
                  )}
                  {c.status !== "REJECTED" && (
                    <button
                      onClick={() => moderate(c.id, "REJECTED")}
                      disabled={isActing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition disabled:opacity-50 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
