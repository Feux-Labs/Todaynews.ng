"use client";

import React, { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPromptModal() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "subscribed" | "closed" | "error">("idle");

  useEffect(() => {
    const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
    if (!supported) return;

    // Delay prompt by 4 seconds to optimize user flow
    const timer = setTimeout(() => {
      const isSubscribed = localStorage.getItem("push_subscriber") === "true";
      const isDeclined = localStorage.getItem("push_declined_date");
      const permissionDenied = Notification.permission === "denied";

      if (!isSubscribed && !permissionDenied) {
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
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("Push not configured");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        setTimeout(() => setShow(false), 2000);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      if (!res.ok) throw new Error("Subscribe request failed");

      localStorage.setItem("push_subscriber", "true");
      setStatus("subscribed");
      setTimeout(() => setShow(false), 2000);
    } catch (err) {
      console.error("Push subscription failed:", err);
      setStatus("error");
      setTimeout(() => setShow(false), 2500);
    }
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
            ) : status === "subscribed" ? (
              <span className="text-xs text-flag font-bold flex items-center gap-1">
                <Check className="h-3 w-3" /> Subscribed!
              </span>
            ) : (
              <span className="text-xs text-signal font-bold">Could not enable alerts.</span>
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
