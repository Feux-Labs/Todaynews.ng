"use client";

import React, { useEffect, useRef } from "react";
import Script from "next/script";

// ─── Ad Configuration ──────────────────────────────────────────────────────
const AD_KEY = "f1676b31bf7fb91f65c368c428768a54";
const AD_INVOKE_URL = `https://wailsilence.com/${AD_KEY}/invoke.js`;

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
}

export default function AdSlot({
  id,
  type,
  className = "",
  smartlinkUrl = process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK || "https://todaynews.ng",
  smartlinkLabel = "🔥 Trending Deals & Offers in Nigeria — Click Here",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Banner (iframe) injection ──────────────────────────────────────────────
  useEffect(() => {
    if (
      (type === "banner" || type === "banner-top" || type === "in-article-mid") &&
      containerRef.current
    ) {
      containerRef.current.innerHTML = "";

      // Top banner → 728×90 leaderboard rectangle
      // In-article / sidebar → 300×250 medium rectangle
      const isWide = type === "banner-top";
      const width = isWide ? 728 : 300;
      const height = isWide ? 90 : 250;

      const confScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.innerHTML = `
        atOptions = {
          'key' : '${AD_KEY}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = AD_INVOKE_URL;
      invokeScript.async = true;

      containerRef.current.appendChild(confScript);
      containerRef.current.appendChild(invokeScript);
    }
  }, [type]);

  // ── Native Banner Widget injection ─────────────────────────────────────────
  useEffect(() => {
    if ((type === "native" || type === "sidebar-native") && containerRef.current) {
      containerRef.current.innerHTML = "";

      const nativeScript = document.createElement("script");
      nativeScript.async = true;
      nativeScript.setAttribute("data-cfasync", "false");
      nativeScript.src =
        "https://pl30801291.effectivecpmnetwork.com/f98e29f0e52639872d03cd647118ee6b/invoke.js";

      const nativeDiv = document.createElement("div");
      nativeDiv.id = "container-f98e29f0e52639872d03cd647118ee6b";

      containerRef.current.appendChild(nativeScript);
      containerRef.current.appendChild(nativeDiv);
    }
  }, [type]);

  // ── Smartlink strip ─────────────────────────────────────────────────────────
  if (type === "smartlink") {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
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

  // ── Social Bar — also used for Interstitial template ──────────────────────
  if (type === "social-bar" || type === "interstitial") {
    return (
      <Script
        id={`adsterra-social-bar-${type}`}
        src="https://pl30801290.effectivecpmnetwork.com/9a/e9/3b/9ae93b69d11e842af1c5c33415214763.js"
        strategy="lazyOnload"
      />
    );
  }

  // ── Popunder / In-page Push — headless ─────────────────────────────────────
  if (type === "popunder" || type === "in-page-push") {
    return <div className="hidden" />;
  }

  // ── Rendered container for Banner & Native ─────────────────────────────────
  const isTopBanner = type === "banner-top";

  return (
    <div className={`w-full my-4 flex flex-col items-center justify-center ${className}`}>
      <span className="text-[9px] uppercase font-bold tracking-widest text-muted/60 mb-1 font-mono">
        Sponsored Advertisement
      </span>
      <div
        id={id}
        ref={containerRef}
        className={`w-full flex items-center justify-center overflow-hidden rounded-lg bg-paper border border-ink/5 shadow-sm transition-all ${
          isTopBanner
            ? "min-h-[70px] md:min-h-[90px] max-h-[100px] max-w-[740px] mx-auto"
            : "min-h-[250px] min-w-[300px]"
        }`}
      />
    </div>
  );
}
