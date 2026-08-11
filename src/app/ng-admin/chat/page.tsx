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
  status: "new" | "sent_to_inbox" | "paraphrasing";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-action`,
          role: "assistant",
          content: data.reply || `✅ Action "${action}" completed for: ${card.title}`,
          timestamp: new Date(),
        },
      ]);
    } catch {
      console.error("Action failed");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0a0f1c]/50 backdrop-blur-sm">
        <Bot className="w-6 h-6 text-[#00e676] mr-3" />
        <div>
          <h1 className="text-base font-semibold text-white">Todaynews AI Editor</h1>
          <p className="text-[11px] text-slate-400">Scrape, paraphrase, and publish with AI</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
          <span className="text-xs text-slate-400">AI Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-[#00e676]" />
              </div>
            )}

            <div
              className={`max-w-[70%] ${
                msg.role === "user"
                  ? "bg-[#00e676]/10 border border-[#00e676]/20 text-white"
                  : "bg-[#0f1729] border border-white/5 text-slate-200"
              } rounded-xl px-4 py-3`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              <p className="text-[10px] text-slate-500 mt-2">
                {msg.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
              </p>

              {/* Story Cards */}
              {msg.storyCards && msg.storyCards.length > 0 && (
                <div className="mt-3 space-y-3">
                  {msg.storyCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        {card.imageUrl && (
                          <img
                            src={card.imageUrl}
                            alt=""
                            className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white leading-tight truncate">
                            {card.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{card.summary}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#00e676]/10 text-[#00e676] rounded">
                              {card.category}
                            </span>
                            <span className="text-[10px] text-slate-500">via {card.sourceName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleStoryAction(card, "send_to_inbox")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#00e676]/10 text-[#00e676] text-xs font-medium rounded-md hover:bg-[#00e676]/20 transition"
                        >
                          <Inbox className="w-3 h-3" /> Send to Inbox
                        </button>
                        <button
                          onClick={() => handleStoryAction(card, "paraphrase")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-md hover:bg-blue-500/20 transition"
                        >
                          <RefreshCw className="w-3 h-3" /> Paraphrase
                        </button>
                        <button
                          onClick={() => handleStoryAction(card, "add_to_draft")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-purple-500/10 text-purple-400 text-xs font-medium rounded-md hover:bg-purple-500/20 transition"
                        >
                          <FileEdit className="w-3 h-3" /> Add to Draft
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#00e676]" />
            </div>
            <div className="bg-[#0f1729] border border-white/5 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#00e676]" />
                AI is processing...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-2">
          <div className="grid grid-cols-2 gap-2">
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
      <div className="p-4 border-t border-white/5 bg-[#0a0f1c]/50 backdrop-blur-sm">
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
