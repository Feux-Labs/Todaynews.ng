"use client";

import React, { useState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";

export default function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="bg-paper border-2 border-ink p-6 rounded my-6 font-body">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-flag shrink-0" />
        <h4 className="font-display font-black text-base uppercase tracking-tight text-ink">
          Subscribe to Todaynews.ng Alerts!
        </h4>
      </div>
      <p className="text-xs text-muted mb-4 leading-relaxed">
        Join over 45,000 subscribers getting the hottest Nigerian news, parallel market Naira updates, and raw gist straight to their email inboxes. No spam, reject anytime.
      </p>

      {status === "success" ? (
        <div className="flex items-center gap-2 p-3 bg-flag/10 text-flag rounded text-xs font-bold border border-flag/20">
          <Check className="h-4 w-4" />
          <span>Odg! You have successfully subscribed to Todaynews.ng newsletters.</span>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={status === "loading"}
            className="flex-1 px-3 py-2 border-2 border-ink rounded text-xs bg-white text-ink outline-none focus:border-flag transition-colors font-medium"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-flag hover:bg-flag/95 border-2 border-flag hover:border-flag/95 text-paper px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-colors shadow active:translate-y-[1px]"
          >
            {status === "loading" ? "Joining..." : "Subscribe"}
          </button>
        </form>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 bg-signal/10 text-signal rounded text-xs font-bold border border-signal/20 mt-3">
          <AlertCircle className="h-4 w-4" />
          <span>OOps! Failed to subscribe. Please try again.</span>
        </div>
      )}
    </div>
  );
}
