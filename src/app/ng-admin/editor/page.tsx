"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PenTool,
  Save,
  Send,
  Calendar,
  Link as LinkIcon,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Loader2,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Tag,
  User,
  Clock,
  ArrowLeft,
  X,
  Search,
  ExternalLink,
  Upload,
} from "lucide-react";

const CATEGORIES = [
  "POLITICS",
  "NAIRA",
  "ENTERTAINMENT",
  "SPORTS",
  "SECURITY",
  "METRO",
  "EDUCATION",
  "TECHNOLOGY",
  "HEALTH",
  "SCHOLARSHIP",
  "JAPA",
  "MAKE_MONEY_ONLINE",
];

interface ArticlePageData {
  pageNumber: number;
  title?: string;
  content: string;
}

interface RelatedArticleItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  imageUrl?: string;
}

export default function CmsEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [articleId, setArticleId] = useState<string | null>(editId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("POLITICS");
  const [summary, setSummary] = useState("");
  const [author, setAuthor] = useState("TodaynewsAi");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [readTimeMinutes, setReadTimeMinutes] = useState(3);
  const [pages, setPages] = useState<ArticlePageData[]>([
    { pageNumber: 1, title: "Core Developments & Breaking Report", content: "" },
  ]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Status & Scheduling
  const [publishMode, setPublishMode] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledAt, setScheduledAt] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Hyperlink Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Related Stories Auto Generator Modal
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticleItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load default author name from settings if available
    try {
      const stored = localStorage.getItem("todaynews_site_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.defaultAuthorName) setAuthor(parsed.defaultAuthorName);
      }
    } catch {}

    if (editId) {
      fetchArticleToEdit(editId);
    }
  }, [editId]);

  const showToastMsg = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchArticleToEdit = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title || "");
        setCategory(data.category || "POLITICS");
        setSummary(data.summary || "");
        setAuthor(data.author || "TodaynewsAi");
        setImageUrl(data.imageUrl || "");
        setReadTimeMinutes(data.readTimeMinutes || 3);
        if (data.scheduledAt) {
          setPublishMode("scheduled");
          setScheduledAt(data.scheduledAt.slice(0, 16));
        }
        if (data.pages && data.pages.length > 0) {
          setPages(
            data.pages.map((p: any, idx: number) => ({
              pageNumber: idx + 1,
              title: p.title || `Section ${idx + 1}`,
              content: p.content || "",
            }))
          );
        }
      }
    } catch (err) {
      console.error("Failed to load article:", err);
      showToastMsg("Failed to load article details.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to update the saved HTML while keeping the editor visually rendered.
  const updateActivePageContent = (newContent: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === activePageIndex ? { ...p, content: newContent } : p))
    );
  };

  const syncEditorContent = () => {
    updateActivePageContent(editorRef.current?.innerHTML || "");
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const execEditorCommand = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const insertHtmlAtCursor = (html: string) => {
    focusEditor();
    document.execCommand("insertHTML", false, html);
    syncEditorContent();
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    const href = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl.trim()}`;
    const textToDisplay = linkText.trim() || href;
    const linkHtml = `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#2563eb] underline font-medium hover:text-[#1d4ed8]">${textToDisplay}</a>`;
    insertHtmlAtCursor(` ${linkHtml} `);
    
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
    showToastMsg("Hyperlink inserted!");
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setImageUploading(true);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
      });

      try {
        const res = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileData }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          setImageUrl(data.url);
          showToastMsg("Featured image uploaded successfully.");
          return;
        }
      } catch (apiErr) {
        console.warn("API upload failed, using local Data URL fallback:", apiErr);
      }

      // Local Data URL fallback if API fails
      setImageUrl(fileData);
      showToastMsg("Featured image uploaded successfully.");
    } catch (err: any) {
      console.error("Image upload failed:", err);
      showToastMsg("Image upload failed. Please try a different file.", "error");
    } finally {
      setImageUploading(false);
    }
  };

  const fetchRelatedStories = async () => {
    setShowRelatedModal(true);
    setLoadingRelated(true);
    try {
      const res = await fetch(`/api/articles?status=PUBLISHED&limit=20&category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setRelatedArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Failed to fetch related stories:", err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const insertRelatedStory = (item: RelatedArticleItem) => {
    const widgetHtml = `
<div class="p-4 my-5 bg-slate-50 border-l-4 border-[#2563eb] rounded-r-lg shadow-md">
  <span class="text-[11px] text-[#2563eb] font-extrabold uppercase tracking-wider block mb-1">📌 READ ALSO:</span>
  <h5 class="text-base font-bold text-slate-900 leading-snug">
    <a href="/news/${item.slug}" target="_blank" class="hover:underline hover:text-[#2563eb] transition">${item.title}</a>
  </h5>
</div>
`.trim();

    const activeContent = pages[activePageIndex]?.content || "";
    updateActivePageContent(activeContent + "\n\n" + widgetHtml + "\n\n");
    setShowRelatedModal(false);
    showToastMsg(`Inserted related story link for: "${item.title.substring(0, 30)}..."`);
  };

  const addPage = () => {
    const newPageNum = pages.length + 1;
    setPages((prev) => [
      ...prev,
      { pageNumber: newPageNum, title: `Page ${newPageNum} Details`, content: "" },
    ]);
    setActivePageIndex(pages.length);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      showToastMsg("Article must have at least one page section.", "error");
      return;
    }
    const updated = pages.filter((_, i) => i !== index);
    setPages(updated.map((p, idx) => ({ ...p, pageNumber: idx + 1 })));
    setActivePageIndex(Math.max(0, index - 1));
  };

  const handleSave = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    if (!title.trim()) {
      showToastMsg("Please enter an article headline.", "error");
      return;
    }
    if (!summary.trim()) {
      showToastMsg("Please enter a summary or meta description.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        summary: summary.trim(),
        author: author.trim() || "Todaynews.ng Editorial",
        imageUrl: imageUrl.trim() || undefined,
        readTimeMinutes: Number(readTimeMinutes) || 3,
        status: targetStatus,
        scheduledAt: publishMode === "scheduled" && scheduledAt ? scheduledAt : undefined,
        pages: pages.map((p, i) => ({
          pageNumber: i + 1,
          title: p.title || `Section ${i + 1}`,
          content: p.content.trim() || `<p>${summary.trim()}</p>`,
        })),
      };

      let res;
      if (articleId) {
        res = await fetch(`/api/articles/${articleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        if (saved.id) setArticleId(saved.id);
        const actionLabel =
          targetStatus === "PUBLISHED"
            ? publishMode === "scheduled"
              ? "Article Scheduled Successfully!"
              : "Article Published Live to Todaynews.ng!"
            : "Saved as Draft!";
        showToastMsg(`✅ ${actionLabel}`);
        setTimeout(() => {
          router.push(publishMode === "scheduled" ? "/ng-admin/drafts" : targetStatus === "PUBLISHED" ? "/ng-admin/published" : "/ng-admin/drafts");
        }, 1500);
      } else {
        const errData = await res.json();
        showToastMsg(errData.error || "Failed to save article.", "error");
      }
    } catch (err) {
      console.error("Save article error:", err);
      showToastMsg("Network error saving article.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredRelated = relatedArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(relatedSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(relatedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
            toast.type === "success"
              ? "bg-blue-50 border-blue-200/50 text-blue-100"
              : "bg-rose-950 border-rose-500/50 text-rose-300"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-6 h-6 text-[#2563eb]" />
              {articleId ? "Edit News Article" : "Create Manual News (Blogger Studio)"}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Draft, format with hyperlinks, auto-suggest related stories, and publish or schedule
            </p>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-400" />}
            Save Draft
          </button>

          <button
            onClick={() => handleSave("PUBLISHED")}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#2563eb]/20 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : publishMode === "scheduled" ? (
              <Calendar className="w-4 h-4 text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
            {publishMode === "scheduled" ? "Schedule Post" : "Publish Now"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563eb] mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading article details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column — Editor Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title / Headline */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Article Headline / Title <span className="text-[#2563eb]">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter compelling headline for Google News..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold text-lg placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
              />
              {title.trim() && (
                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-[#2563eb]" />
                  Preview Slug: todaynews.ng/news/
                  <span className="text-slate-700">
                    {title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                      .substring(0, 50)}
                  </span>
                </p>
              )}
            </div>

            {/* Summary / Meta Description */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Summary / Meta Description <span className="text-[#2563eb]">*</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="Write a 2-3 sentence meta description for Google Search & Discover..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 resize-none"
              />
            </div>

            {/* Multi-Page Content Section Manager (Blogger Studio) */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#2563eb]" />
                  <h3 className="text-sm font-bold text-slate-900">Article Pages & Sections</h3>
                </div>

                {/* Page Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {pages.map((p, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePageIndex(index)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        activePageIndex === index
                          ? "bg-[#2563eb] text-white"
                          : "bg-slate-50 text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Page {p.pageNumber}
                    </button>
                  ))}
                  <button
                    onClick={addPage}
                    className="p-1.5 bg-[#2563eb]/10 text-[#2563eb] hover:bg-[#2563eb]/20 rounded-lg transition"
                    title="Add Page Section"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Page Header Title */}
              <div className="flex items-center justify-between gap-3">
                <input
                  value={pages[activePageIndex]?.title || ""}
                  onChange={(e) =>
                    setPages((prev) =>
                      prev.map((p, i) => (i === activePageIndex ? { ...p, title: e.target.value } : p))
                    )
                  }
                  placeholder={`Page ${activePageIndex + 1} Section Header`}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
                {pages.length > 1 && (
                  <button
                    onClick={() => removePage(activePageIndex)}
                    className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 rounded-lg transition text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Page
                  </button>
                )}
              </div>

              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <button
                  type="button"
                onClick={() => execEditorCommand("bold")}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 rounded"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                onClick={() => execEditorCommand("italic")}
                  className="px-2.5 py-1 text-xs italic font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 rounded"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                onClick={() => execEditorCommand("formatBlock", "h3")}
                  className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 rounded"
                  title="Subheading"
                >
                  H3
                </button>
                <button
                  type="button"
                onClick={() => execEditorCommand("formatBlock", "p")}
                  className="px-2.5 py-1 text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 rounded"
                  title="Paragraph"
                >
                  Paragraph
                </button>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                {/* Hyperlink Button */}
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2563eb] bg-[#2563eb]/10 hover:bg-[#2563eb]/20 border border-[#2563eb]/30 rounded transition"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Add Link
                </button>

                {/* Auto Suggest Related Story */}
                <button
                  type="button"
                  onClick={fetchRelatedStories}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Suggest Related Story
                </button>
              </div>

              <div
                key={activePageIndex}
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={syncEditorContent}
                onBlur={syncEditorContent}
                data-placeholder={`Write article content for Page ${activePageIndex + 1}...`}
                dangerouslySetInnerHTML={{ __html: pages[activePageIndex]?.content || "" }}
                className="min-h-72 w-full p-4 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 prose prose-invert max-w-none prose-a:text-[#2563eb] prose-a:underline prose-p:mb-4 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600"
              />

              <p className="text-[11px] text-slate-500">
                Links render as green text in the editor and on the public article.
              </p>
            </div>
          </div>

          {/* Sidebar Settings Column */}
          <div className="space-y-6">
            {/* Publishing Settings Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Calendar className="w-4 h-4 text-[#2563eb]" />
                Publishing Schedule
              </h3>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">Publication Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishMode("immediate")}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      publishMode === "immediate"
                        ? "bg-[#2563eb]/20 text-[#2563eb] border-[#2563eb]/40"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    Publish Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishMode("scheduled")}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      publishMode === "scheduled"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-50 text-slate-400 border-slate-200"
                    }`}
                  >
                    Schedule Post
                  </button>
                </div>

                {publishMode === "scheduled" && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs text-slate-400 block">Select Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Settings Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <Tag className="w-4 h-4 text-[#2563eb]" />
                Article Metadata
              </h3>

              {/* Category Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">News Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author Byline */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Author / Byline</label>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  />
                </div>
              </div>

              {/* Reading Time */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">Estimated Read Time (Mins)</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-semibold text-slate-700 block">Featured Image</label>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  />
                </div>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#2563eb]/10 hover:bg-[#2563eb]/20 text-[#2563eb] border border-[#2563eb]/30 rounded-lg text-xs font-bold cursor-pointer transition">
                  {imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {imageUploading ? "Uploading..." : "Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={imageUploading}
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  />
                </label>

                {/* Curated Presets */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">Quick Curated Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: "Politics", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Naira", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Metro", url: "https://images.unsplash.com/photo-1577975882846-431adc8c2009?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Security", url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Sports", url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Afrobeats", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Tech", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80" },
                      { label: "Japa", url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80" },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setImageUrl(p.url)}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-50 hover:bg-[#2563eb]/20 text-slate-700 hover:text-[#2563eb] transition border border-slate-200 hover:border-[#2563eb]/30"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {imageUrl.trim() && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 h-32 bg-black/40">
                    <img src={imageUrl} alt="Featured Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hyperlink Insertion Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#2563eb]" />
                Insert Hyperlink
              </h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Link Display Text</label>
                <input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Read full Vanguard report"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target URL</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddLink}
                className="flex-1 py-2 bg-[#2563eb] text-white font-bold text-xs rounded-lg hover:bg-[#1d4ed8]"
              >
                Insert Link
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Suggest Related Stories Modal */}
      {showRelatedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-2xl space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Auto-Suggest Related Stories
                </h3>
                <p className="text-xs text-slate-400">
                  Select published articles from Todaynews.ng to insert as styled related story links
                </p>
              </div>
              <button onClick={() => setShowRelatedModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={relatedSearch}
                onChange={(e) => setRelatedSearch(e.target.value)}
                placeholder="Search published site stories..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRelated ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Fetching published stories...</p>
                </div>
              ) : filteredRelated.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No published stories found matching category: {category}
                </div>
              ) : (
                filteredRelated.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4 hover:border-[#2563eb]/30 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[9px] px-1.5 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded font-bold">
                          {item.category}
                        </span>
                        <h5 className="text-sm font-semibold text-slate-900 truncate mt-0.5">{item.title}</h5>
                      </div>
                    </div>

                    <button
                      onClick={() => insertRelatedStory(item)}
                      className="px-3 py-1.5 bg-[#2563eb]/10 hover:bg-[#2563eb]/20 text-[#2563eb] text-xs font-bold rounded-lg border border-[#2563eb]/30 whitespace-nowrap"
                    >
                      + Insert Link
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
