"use client";

import React, { useEffect, useRef } from "react";
import Script from "next/script";

export type AdsterraFormat =
  | "popunder"
  | "in-page-push"
  | "interstitial"
  | "social-bar"
  | "native"
  | "banner"
  | "smartlink"
  | "banner-top"
  | "in-article-mid"
  | "sidebar-native";

interface AdSlotProps {
  id: string;
  type: AdsterraFormat;
  className?: string;
  smartlinkUrl?: string;
  smartlinkLabel?: string;
  bannerSize?: "728x90" | "300x250" | "468x60" | "160x600";
}

export default function AdSlot({
  id,
  type,
  className = "",
  smartlinkUrl = process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK || "https://todaynews.ng",
  smartlinkLabel = "🔥 Trending Deals & Offers in Nigeria — Click Here",
  bannerSize = "300x250",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Script injection for Banner 300x250
  useEffect(() => {
    if ((type === "banner" || type === "banner-top" || type === "in-article-mid") && containerRef.current) {
      containerRef.current.innerHTML = "";
      const confScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.innerHTML = `
        atOptions = {
          'key' : 'baec4ba691aee8e6facd331480c3ff7a',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = "https://www.highperformanceformat.com/baec4ba691aee8e6facd331480c3ff7a/invoke.js";
      invokeScript.async = true;

      containerRef.current.appendChild(confScript);
      containerRef.current.appendChild(invokeScript);
    }
  }, [type]);

  // Script injection for Native Banner Widget
  useEffect(() => {
    if ((type === "native" || type === "sidebar-native") && containerRef.current) {
      containerRef.current.innerHTML = "";

      const nativeScript = document.createElement("script");
      nativeScript.async = true;
      nativeScript.setAttribute("data-cfasync", "false");
      nativeScript.src = "https://pl30801291.effectivecpmnetwork.com/f98e29f0e52639872d03cd647118ee6b/invoke.js";

      const nativeDiv = document.createElement("div");
      nativeDiv.id = "container-f98e29f0e52639872d03cd647118ee6b";

      containerRef.current.appendChild(nativeScript);
      containerRef.current.appendChild(nativeDiv);
    }
  }, [type]);

  // Smartlink component
  if (type === "smartlink") {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer shadow"
        className={`my-4 flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:brightness-110 transition-all text-sm group ${className}`}
      >
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
          {smartlinkLabel}
        </span>
        <span className="text-xs bg-black/30 px-3 py-1 rounded-full group-hover:translate-x-1 transition-transform">
          Sponsored Link →
        </span>
      </a>
    );
  }

  // Social Bar format (script injected directly near body end)
  if (type === "social-bar") {
    return (
      <Script
        id="adsterra-social-bar-script"
        src="https://pl30801290.effectivecpmnetwork.com/9a/e9/3b/9ae93b69d11e842af1c5c33415214763.js"
        strategy="lazyOnload"
      />
    );
  }

  // Other popunder or push formats
  if (type === "popunder" || type === "in-page-push" || type === "interstitial") {
    return (
      <div className="hidden">
        {/* Placeholder for additional script units */}
      </div>
    );
  }

  // Render container for Banner and Native units
  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center ${className}`}>
      <span className="text-[9px] uppercase font-bold tracking-widest text-muted/60 mb-1 font-mono">
        Sponsored Advertisement
      </span>
      <div
        id={id}
        ref={containerRef}
        className="min-h-[250px] min-w-[300px] flex items-center justify-center overflow-hidden rounded-lg bg-paper border border-ink/5 shadow-sm"
      />
    </div>
  );
}
