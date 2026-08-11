"use client";

import React, { useState } from "react";
import { MessageSquare, Check } from "lucide-react";

interface ClickToQuoteProps {
  quote: string;
  context?: string;
}

export default function ClickToQuote({ quote, context = "Todaynews.ng Exclusive" }: ClickToQuoteProps) {
  const [shared, setShared] = useState(false);

  const handleWhatsAppShare = () => {
    const text = `🔥 "${quote}" — ${context}\nRead full details on Todaynews.ng: ${window.location.href}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <div
      onClick={handleWhatsAppShare}
      className="my-6 p-5 border-l-4 border-flag bg-flag/5 hover:bg-flag/10 cursor-pointer rounded-r transition-all group relative shadow-sm"
    >
      <span className="text-[10px] font-bold text-flag uppercase tracking-widest block mb-2 font-mono">
        {context} • Click to share on WhatsApp
      </span>
      <blockquote className="text-base font-display font-semibold italic text-ink group-hover:text-flag transition-colors">
        "{quote}"
      </blockquote>
      <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-muted group-hover:text-flag transition-colors">
        {shared ? (
          <>
            <Check className="h-3.5 w-3.5 text-flag animate-bounce" />
            <span className="text-flag">Sent to WhatsApp!</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-3.5 w-3.5 text-flag group-hover:animate-pulse" />
            <span>Click to send to your group & status</span>
          </>
        )}
      </div>
    </div>
  );
}
