"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Facebook, Twitter, Send, Link2, Check } from "lucide-react";

interface SocialShareBarProps {
  url: string;
  title: string;
  isFloating?: boolean;
}

export default function SocialShareBar({ url, title, isFloating = false }: SocialShareBarProps) {
  const [shareCount, setShareCount] = useState(48);
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");

  useEffect(() => {
    setFullUrl(window.location.origin + url);
  }, [url]);

  const handleShareClick = (platform: string) => {
    setShareCount((prev) => prev + 1);

    const encodedText = encodeURIComponent(
      `🔥 Oya see wetin dey happen for Nigeria today! read am sharp-sharp on Todaynews.ng: "${title}" 👇\n`
    );
    const encodedUrl = encodeURIComponent(fullUrl || url);

    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodedText}${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl || url);
    setCopied(true);
    setShareCount((prev) => prev + 1);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareButtons = [
    {
      name: "whatsapp",
      icon: <MessageSquare className="h-4.5 w-4.5 text-white" />,
      color: "bg-[#25D366] hover:bg-[#20ba56]",
      label: "WhatsApp",
    },
    {
      name: "facebook",
      icon: <Facebook className="h-4.5 w-4.5 text-white fill-current" />,
      color: "bg-[#1877F2] hover:bg-[#166fe3]",
      label: "Facebook",
    },
    {
      name: "twitter",
      icon: <Twitter className="h-4.5 w-4.5 text-white fill-current" />,
      color: "bg-[#1DA1F2] hover:bg-[#1a94e0]",
      label: "X",
    },
    {
      name: "telegram",
      icon: <Send className="h-4.5 w-4.5 text-white fill-current" />,
      color: "bg-[#0088cc] hover:bg-[#007cbd]",
      label: "Telegram",
    },
  ];

  if (isFloating) {
    return (
      <div className="hidden lg:flex flex-col items-center gap-3 fixed left-6 top-1/3 z-40 bg-paper border-2 border-ink p-3 rounded shadow-md">
        <div className="text-center punch-border pb-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
            Shares
          </span>
          <span className="text-lg font-black font-display text-flag">{shareCount}</span>
        </div>
        {shareButtons.map((btn) => (
          <button
            key={btn.name}
            onClick={() => handleShareClick(btn.name)}
            title={`Share on ${btn.label}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${btn.color}`}
          >
            {btn.icon}
          </button>
        ))}
        <button
          onClick={handleCopy}
          title="Copy Article Link"
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 bg-ink`}
        >
          {copied ? (
            <Check className="h-4.5 w-4.5 text-flag" />
          ) : (
            <Link2 className="h-4.5 w-4.5 text-white" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="my-6 border-t-2 border-b-2 border-ink/10 py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-muted">
            Kindly Share This Story:
          </span>
          <span className="bg-flag text-white text-[11px] font-black px-2 py-0.5 rounded-full font-mono">
            {shareCount} Shares
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareButtons.map((btn) => (
            <button
              key={btn.name}
              onClick={() => handleShareClick(btn.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-white text-xs font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px] ${btn.color}`}
            >
              {btn.icon}
              <span className="hidden md:inline">{btn.label}</span>
            </button>
          ))}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-ink text-white text-xs font-bold transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-flag" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5 text-white" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
