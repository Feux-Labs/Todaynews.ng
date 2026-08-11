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
  timestamp: Date;
  storyCards?: StoryCard[];
}

interface StoryCard {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  category: string;
  imageUrl?: string;
  status: "new" | "sent_to_inbox" | "in_draft" | "paraphrasing";
}

const SUGGESTIONS = [
  { icon: Search, label: "Fetch trending Nigeria news" },
  { icon: Globe, label: "Scrape Punch NG for latest headlines" },
  { icon: Newspaper, label: "Find BBNaija trending stories" },
  { icon: Sparkles, label: "Get Naira/Dollar exchange updates" },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Welcome to the Todaynews.ng AI Editor! 🇳🇬\n\nI can help you:\n• **Scrape** news from any source or topic\n• **Paraphrase** articles for unique content\n• **Find** trending stories across Nigeria\n• **Search** for specific topics (politics, sports, entertainment, etc.)\n\nTry typing a command like: \"Fetch latest Punch NG headlines\" or \"Find trending Abuja news\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/admin/chat");
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          const loaded = data.history.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(loaded);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the AI Chat conversation history?")) return;
    try {
      const res = await fetch("/api/admin/chat", { method: "DELETE" });
      if (res.ok) {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Welcome to the Todaynews.ng AI Editor! 🇳🇬\n\nI can help you:\n• **Scrape** news from any source or topic\n• **Paraphrase** articles for unique content\n• **Find** trending stories across Nigeria\n• **Search** for specific topics (politics, sports, entertainment, etc.)\n\nTry typing a command like: \"Fetch latest Punch NG headlines\" or \"Find trending Abuja news\"",
            timestamp: new Date(),
          },
        ]);
      }
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
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "assistant",
        content: data.reply || "I processed your request.",
        timestamp: new Date(),
        storyCards: data.stories || [],
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          role: "assistant",
          content: "⚠️ Connection error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryAction = async (
    card: StoryCard,
    action: "send_to_inbox" | "paraphrase" | "add_to_draft"
  ) => {
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          storyId: card.id,
          storyTitle: card.title,
          storySummary: card.summary,
          storyCategory: card.category,
          storySource: card.sourceName,
        }),
      });

      const data = await res.json();

      // Refresh memory status logs
      await fetchHistory();

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-action`,
          role: "assistant",
          content: data.reply || `✅ Action completed successfully!`,
          timestamp: new Date(),
        },
      ]);
    } catch {
      console.error("Action failed");
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
    <div className="flex flex-col h-[calc(100vh-40px)]">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-sm shrink-0">
        <Bot className="w-6 h-6 text-[#00e676] mr-3" />
        <div>
          <h1 className="text-base font-semibold text-white">Todaynews AI Editor</h1>
          <p className="text-[11px] text-slate-400">Scrape, paraphrase, and publish with AI</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition"
            title="Clear Chat Memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Memory
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">AI Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const hasMarkdown = msg.content.includes("###") || msg.content.includes("**");
          return (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center flex-shrink-0 mt-1 border border-[#00e676]/20">
                  <Bot className="w-4 h-4 text-[#00e676]" />
                </div>
              )}

              <div
                className={`max-w-[75%] relative group ${
                  msg.role === "user"
                    ? "bg-[#00e676]/10 border border-[#00e676]/20 text-white"
                    : "bg-[#0f1729] border border-white/5 text-slate-200"
                } rounded-xl px-4 py-3 shadow-md`}
              >
                {/* Copy content button for Assistant custom texts */}
                {msg.role === "assistant" && hasMarkdown && (
                  <button
                    onClick={() => handleCopyText(msg.content, msg.id)}
                    className="absolute right-3 top-3 p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
                    title="Copy full text"
                  >
                    {copiedId === msg.id ? (
                      <CheckCircle className="w-3.5 h-3.5 text-[#00e676]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <div className="text-sm whitespace-pre-wrap leading-relaxed pr-6">{msg.content}</div>
                <p className="text-[9px] text-slate-500 mt-2 font-mono">
                  {msg.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                </p>

                {/* Story Cards */}
                {msg.storyCards && msg.storyCards.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {msg.storyCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 hover:border-[#00e676]/20 transition"
                      >
                        <div className="flex items-start gap-3">
                          {card.imageUrl && (
                            <img
                              src={card.imageUrl}
                              alt=""
                              className="w-16 h-16 rounded-md object-cover flex-shrink-0 border border-white/5"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white leading-tight truncate">
                              {card.title}
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{card.summary}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#00e676]/10 text-[#00e676] rounded font-mono">
                                {card.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">via {card.sourceName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleStoryAction(card, "send_to_inbox")}
                            disabled={card.status === "sent_to_inbox" || card.status === "in_draft"}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition ${
                              card.status === "sent_to_inbox"
                                ? "bg-emerald-500/10 text-emerald-400 cursor-not-allowed border border-emerald-500/20"
                                : card.status === "in_draft"
                                ? "bg-slate-500/5 text-slate-500 cursor-not-allowed"
                                : "bg-[#00e676]/10 text-[#00e676] hover:bg-[#00e676]/20 border border-[#00e676]/15"
                            }`}
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            {card.status === "sent_to_inbox" ? "Sent to Inbox" : "Send to Inbox"}
                          </button>
                          <button
                            onClick={() => handleStoryAction(card, "paraphrase")}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-md hover:bg-blue-500/20 border border-blue-500/15 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Paraphrase
                          </button>
                          <button
                            onClick={() => handleStoryAction(card, "add_to_draft")}
                            disabled={card.status === "sent_to_inbox" || card.status === "in_draft"}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition ${
                              card.status === "in_draft"
                                ? "bg-purple-500/10 text-purple-400 cursor-not-allowed border border-purple-500/20"
                                : card.status === "sent_to_inbox"
                                ? "bg-slate-500/5 text-slate-500 cursor-not-allowed"
                                : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/15"
                            }`}
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            {card.status === "in_draft" ? "Added to Draft" : "Add to Draft"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1 border border-white/10">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center flex-shrink-0 border border-[#00e676]/20">
              <Bot className="w-4 h-4 text-[#00e676]" />
            </div>
            <div className="bg-[#0f1729] border border-white/5 rounded-xl px-4 py-3 shadow-md">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#00e676]" />
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
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10 transition text-left"
                >
                  <Icon className="w-4 h-4 text-[#00e676] flex-shrink-0" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0a0f1c]/50 backdrop-blur-sm shrink-0">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Type a command... e.g. "Scrape Punch for politics today"'
              rows={1}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00e676]/40 resize-none text-sm"
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 bg-[#00e676] hover:bg-[#00c853] text-[#060b18] rounded-xl flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#00e676]/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
