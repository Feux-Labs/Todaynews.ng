"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";

export default function PushPromptModal() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "subscribed" | "closed">("idle");

  useEffect(() => {
    // Delay prompt by 4 seconds to optimize user flow
    const timer = setTimeout(() => {
      const isSubscribed = localStorage.getItem("push_subscriber") === "true";
      const isDeclined = localStorage.getItem("push_declined_date");

      if (!isSubscribed) {
        // If declined, check if 24 hours have passed
        if (isDeclined) {
          const hours = (Date.now() - parseInt(isDeclined, 10)) / (1000 * 60 * 60);
          if (hours > 24) {
            setShow(true);
          }
        } else {
          setShow(true);
        }
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    try {
      // Simulate API call to register endpoint
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `push_${Math.random().toString(36).substring(7)}@todaynews.ng` }),
      });
    } catch (e) {
      console.warn("Subscriber API write fallback handled");
    }

    localStorage.setItem("push_subscriber", "true");
    setStatus("subscribed");
    setTimeout(() => {
      setShow(false);
    }, 2000);
  };

  const handleLater = () => {
    localStorage.setItem("push_declined_date", Date.now().toString());
    setStatus("closed");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs w-full bg-ink text-paper border-2 border-flag rounded-lg shadow-2xl p-4 animate-bounce-short">
      <div className="flex items-start gap-3">
        <div className="bg-flag text-paper p-2 rounded-full shrink-0">
          <Bell className="h-5 w-5 animate-swing" />
        </div>
        <div className="flex-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-flag">
            Get Todaynews Alerts
          </h5>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Allow notifications to get breaking news, Naira rate updates, & hot gist as it dey happen!
          </p>

          <div className="flex items-center gap-2 mt-3 justify-end">
            {status === "idle" ? (
              <>
                <button
                  onClick={handleLater}
                  className="text-[10px] uppercase font-bold text-muted hover:text-paper px-2 py-1 rounded transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleSubscribe}
                  className="bg-flag text-paper text-[10px] uppercase font-black px-3 py-1.5 rounded hover:bg-flag/80 transition-colors shadow"
                >
                  Allow Alerts
                </button>
              </>
            ) : (
              <span className="text-xs text-flag font-bold flex items-center gap-1">
                <Check className="h-3 w-3" /> Subscribed!
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLater}
          className="text-muted hover:text-paper transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
