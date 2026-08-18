"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Inbox,
  FileEdit,
  RefreshCw,
  Sparkles,
  Globe,
  Search,
  Newspaper,
  Trash2,
  Copy,
  CheckCircle,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // Stored as ISO string for reliable JSON serialization
  storyCards?: StoryCard[];
}

interface StoryCard {
  id: string;
  title: string;
  summary: string;
  content?: string;
  sourceName: string;
  sourceUrl?: string;
  category: string;
  imageUrl?: string;
  status: "new" | "sent_to_inbox" | "in_draft" | "published";
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY = "todaynews_ai_chat_history_v2";

const DEFAULT_WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to the Todaynews.ng AI Editor! 🇳🇬\n\nI can help you:\n• **Scrape** news from any source or topic\n• **Paraphrase** articles for unique content\n• **Find** trending stories across Nigeria\n• **Search** for specific topics (politics, sports, entertainment, etc.)\n\nTry typing a command like: \"Fetch latest Punch NG headlines\" or \"Find trending security news\"",
  timestamp: new Date().toISOString(),
};

const SUGGESTIONS = [
  { icon: Search, label: "Fetch trending Nigeria news" },
  { icon: Globe, label: "Scrape Punch NG for latest headlines" },
  { icon: Newspaper, label: "Find BBNaija trending stories" },
  { icon: Sparkles, label: "Get Naira/Dollar exchange updates" },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ cardId: string; action: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  // ── Load history on mount (LocalStorage first for instant zero-latency load, then API sync)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load local chat history:", err);
    }
    fetchHistory();
  }, []);

  // ── Sync messages to LocalStorage whenever messages state changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Failed to save local chat history:", err);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, actionLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchHistory = async (sessionId?: string | null) => {
    try {
      const res = await fetch(`/api/admin/chat${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.activeSessionId) setSelectedSessionId(data.activeSessionId);
        if (data.history && data.history.length > 0) {
          // Merge server history with local history if server has items
          const serverMsgs = data.history.map((m: any) => ({
            ...m,
            timestamp: typeof m.timestamp === "string" ? m.timestamp : new Date(m.timestamp).toISOString(),
          }));
          
          setMessages(serverMsgs);
        } else if (data.activeSessionId) {
          setMessages([DEFAULT_WELCOME_MSG]);
        }
      }
    } catch (err) {
      console.error("Failed to load server chat history:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the AI Chat conversation history?")) return;
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await fetch(`/api/admin/chat${selectedSessionId ? `?sessionId=${encodeURIComponent(selectedSessionId)}` : ""}`, { method: "DELETE" });
      setMessages([DEFAULT_WELCOME_MSG]);
      setSelectedSessionId(null);
      await fetchHistory();
      showToast("Chat memory cleared");
    } catch (err) {
      console.error("Failed to clear chat memory:", err);
    }
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, sessionId: selectedSessionId }),
      });

      const data = await res.json();
      if (data.sessionId) setSelectedSessionId(data.sessionId);

      if (!res.ok && !data.reply) {
        throw new Error(data.error || "AI service encountered an issue.");
      }

      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.reply || "I received your message.",
        timestamp: new Date().toISOString(),
        storyCards: data.stories || [],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: err?.message ? `⚠️ ${err.message}` : "⚠️ Connection error. Please try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryAction = async (
    card: StoryCard,
    action: "send_to_inbox" | "paraphrase" | "add_to_draft" | "publish"
  ) => {
    setActionLoading({ cardId: card.id, action });
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          sessionId: selectedSessionId,
          storyId: card.id,
          storyTitle: card.title,
          storySummary: card.summary,
          storyContent: card.content,
          storyCategory: card.category,
          storySource: card.sourceName,
          storySourceUrl: card.sourceUrl,
          storyImageUrl: card.imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Action failed");
      }

      // Update local message state: set card status to reflect the action taken
      if (action === "send_to_inbox" || action === "add_to_draft" || action === "publish") {
        const newStatus =
          action === "send_to_inbox" ? "sent_to_inbox" : action === "add_to_draft" ? "in_draft" : "published";
        setMessages((prev) =>
          prev.map((msg) => {
            if (!msg.storyCards) return msg;
            return {
              ...msg,
              storyCards: msg.storyCards.map((c) =>
                c.id === card.id ? { ...c, status: newStatus } : c
              ),
            };
          })
        );
      }

      // Append assistant confirmation / paraphrased story to thread
      const aiMsg: Message = {
        id: `msg-${Date.now()}-action`,
        role: "assistant",
        content: data.reply || `✅ Action completed successfully!`,
        timestamp: new Date().toISOString(),
        storyCards: data.stories || [],
      };

      setMessages((prev) => [...prev, aiMsg]);

      const toastLabel =
        action === "send_to_inbox"
          ? "Saved to Inbox (Pending Review)!"
          : action === "add_to_draft"
          ? "Saved to Drafts!"
          : action === "publish"
          ? "Published live on Todaynews.ng!"
          : "Paraphrased with AI!";
      showToast(toastLabel);
    } catch (err: any) {
      console.error("Action error:", err);
      showToast("❌ Failed to process action. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-40px)] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 right-6 z-50 bg-[#2563eb] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
        <Bot className="w-6 h-6 text-[#2563eb] mr-3" />
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">Todaynews AI Editor</h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Scrape, paraphrase, and publish with AI</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedSessionId(null);
              setMessages([DEFAULT_WELCOME_MSG]);
              setInput("");
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition"
            title="Start New Session"
          >
            New Session
          </button>
          {sessions.length > 0 && (
            <select
              value={selectedSessionId || ""}
              onChange={(e) => fetchHistory(e.target.value)}
              className="max-w-56 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
              title="Past AI Sessions"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id} className="bg-white dark:bg-slate-900">
                  {session.title}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition"
            title="Clear Chat Memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Memory
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#2563eb] rounded-full animate-pulse" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">AI Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const hasMarkdown = msg.content.includes("###") || msg.content.includes("**");
          const displayTime = new Date(msg.timestamp).toLocaleTimeString("en-NG", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-[#2563eb]/10 flex items-center justify-center flex-shrink-0 mt-1 border border-[#2563eb]/20">
                  <Bot className="w-4 h-4 text-[#2563eb]" />
                </div>
              )}

              <div
                className={`max-w-[80%] relative group ${
                  msg.role === "user"
                    ? "bg-[#2563eb]/10 border border-[#2563eb]/20 text-slate-900 dark:text-white"
                    : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                } rounded-xl px-4 py-3 shadow-md`}
              >
                {/* Copy content button for Assistant custom texts */}
                {msg.role === "assistant" && hasMarkdown && (
                  <button
                    onClick={() => handleCopyText(msg.content, msg.id)}
                    className="absolute right-3 top-3 p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition shrink-0"
                    title="Copy full text"
                  >
                    {copiedId === msg.id ? (
                      <CheckCircle className="w-3.5 h-3.5 text-[#2563eb]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <div className="text-sm whitespace-pre-wrap leading-relaxed pr-6">{msg.content}</div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-2 font-mono">{displayTime}</p>

                {/* Story Cards */}
                {msg.storyCards && msg.storyCards.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {msg.storyCards.map((card) => {
                      const isCardLoading = actionLoading?.cardId === card.id;
                      const loadingAction = isCardLoading ? actionLoading.action : null;

                      return (
                        <div
                          key={card.id}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-[#2563eb]/20 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 relative">
                              <img
                                src={card.imageUrl || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80"}
                                alt={card.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                                {card.title}
                              </h4>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{card.summary}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] px-1.5 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded font-mono">
                                  {card.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                            {/* Send to Inbox Button */}
                            <button
                              onClick={() => handleStoryAction(card, "send_to_inbox")}
                              disabled={isCardLoading || card.status !== "new"}
                              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition ${
                                card.status === "sent_to_inbox"
                                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 cursor-not-allowed"
                                  : card.status !== "new"
                                  ? "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                              } disabled:opacity-60`}
                            >
                              {loadingAction === "send_to_inbox" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : card.status === "sent_to_inbox" ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Inbox className="w-3.5 h-3.5" />
                              )}
                              <span>{card.status === "sent_to_inbox" ? "In Inbox" : "Inbox"}</span>
                            </button>

                            {/* Paraphrase Button */}
                            <button
                              onClick={() => handleStoryAction(card, "paraphrase")}
                              disabled={isCardLoading}
                              className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition disabled:opacity-60"
                            >
                              {loadingAction === "paraphrase" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              <span>Paraphrase</span>
                            </button>

                            {/* Add to Draft Button */}
                            <button
                              onClick={() => handleStoryAction(card, "add_to_draft")}
                              disabled={isCardLoading || card.status !== "new"}
                              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition ${
                                card.status === "in_draft"
                                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 cursor-not-allowed"
                                  : card.status !== "new"
                                  ? "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                              } disabled:opacity-60`}
                            >
                              {loadingAction === "add_to_draft" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : card.status === "in_draft" ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <FileEdit className="w-3.5 h-3.5" />
                              )}
                              <span>{card.status === "in_draft" ? "In Drafts" : "Draft"}</span>
                            </button>

                            {/* Publish Now Button — the primary action */}
                            <button
                              onClick={() => handleStoryAction(card, "publish")}
                              disabled={isCardLoading || card.status !== "new"}
                              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition ${
                                card.status === "published"
                                  ? "bg-[#2563eb]/20 text-[#2563eb] border border-[#2563eb]/30 cursor-not-allowed"
                                  : card.status !== "new"
                                  ? "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed"
                                  : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] border border-[#2563eb]"
                              } disabled:opacity-60`}
                            >
                              {loadingAction === "publish" ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : card.status === "published" ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>{card.status === "published" ? "Live" : "Publish"}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 border border-slate-200 dark:border-slate-700">
                  <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb]/10 flex items-center justify-center flex-shrink-0 border border-[#2563eb]/20">
              <Bot className="w-4 h-4 text-[#2563eb]" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-md">
              <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" />
                Todaynews AI is processing...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2 shrink-0">
          <div className="grid grid-cols-2 gap-2 max-w-4xl mx-auto">
            {SUGGESTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition text-left"
                >
                  <Icon className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type a command... e.g. "Scrape Punch for politics today"'
              rows={1}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40 resize-none text-sm"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#2563eb]/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
