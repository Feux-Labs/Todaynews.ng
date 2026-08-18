"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle } from "lucide-react";

interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export default function CommentsSection({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, authorName: name.trim(), authorEmail: email.trim() || undefined, content: content.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: data.message || "Comment submitted for review." });
        setContent("");
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to submit comment." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t-2 border-ink/10 pt-6 mt-8">
      <h4 className="font-display font-black text-base uppercase text-ink mb-4 flex items-center gap-1.5">
        <MessageSquare className="h-4.5 w-4.5 text-flag" /> Comments ({comments.length})
      </h4>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="border border-ink/10 rounded p-4 bg-paper/30 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="px-3 py-2 rounded border border-ink/15 bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flag/30"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email (optional, not published)"
            className="px-3 py-2 rounded border border-ink/15 bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flag/30"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts on this story..."
          required
          rows={3}
          className="w-full px-3 py-2 rounded border border-ink/15 bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-flag/30 resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          {feedback ? (
            <p className={`text-xs flex items-center gap-1.5 ${feedback.type === "success" ? "text-flag" : "text-signal"}`}>
              {feedback.type === "success" && <CheckCircle className="w-3.5 h-3.5" />}
              {feedback.message}
            </p>
          ) : (
            <span className="text-[10px] text-muted">Comments are reviewed before appearing publicly.</span>
          )}
          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-bold rounded hover:bg-flag transition disabled:opacity-50 shrink-0"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post Comment
          </button>
        </div>
      </form>

      {/* Comment List */}
      {loading ? (
        <p className="text-xs text-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="border border-ink/10 p-3 rounded bg-paper/30 text-xs">
              <span className="font-extrabold text-ink block">{c.authorName}</span>
              <span className="text-[10px] text-muted font-bold block mb-1">
                {new Date(c.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <p className="text-muted leading-relaxed whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
