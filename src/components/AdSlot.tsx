"use client";

import React, { useEffect, useRef, useState } from "react";
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
}

export default function AdSlot({
  id,
  type,
  className = "",
  smartlinkUrl = process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK || "https://todaynews.ng",
  smartlinkLabel = "🔥 Trending Deals & Offers in Nigeria — Click Here",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // ── Banner (iframe) injection — guaranteed config-before-invoke order ────────
  useEffect(() => {
    if (
      (type === "banner" || type === "banner-top" || type === "in-article-mid") &&
      containerRef.current &&
      !injectedRef.current
    ) {
      injectedRef.current = true;
      containerRef.current.innerHTML = "";

      const isWide = type === "banner-top";
      const width = isWide ? 728 : 300;
      const height = isWide ? 90 : 250;
      const key = isWide
        ? "f1676b31bf7fb91f65c368c428768a54"   // 728×90 leaderboard
        : "baec4ba691aee8e6facd331480c3ff7a";  // 300×250 rectangle
      const src = isWide
        ? "https://wailsilence.com/f1676b31bf7fb91f65c368c428768a54/invoke.js"
        : "https://wailsilence.com/baec4ba691aee8e6facd331480c3ff7a/invoke.js";

      // STEP 1 — Set config on window synchronously BEFORE inject script
      (window as any).atOptions = {
        key,
        format: "iframe",
        height,
        width,
        params: {},
      };

      // STEP 2 — Inline <script> to ensure atOptions is declared in the same tick
      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.text = `
        window.atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      containerRef.current.appendChild(configScript);

      // STEP 3 — Only after config script is appended, inject invoke script
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = src;
      invokeScript.async = false; // synchronous load order critical
      invokeScript.onload = () => setAdLoaded(true);
      invokeScript.onerror = () => setAdLoaded(true); // hide placeholder even on error

      containerRef.current.appendChild(invokeScript);
    }
  }, [type]);

  // ── Native Banner Widget injection ─────────────────────────────────────────
  useEffect(() => {
    if ((type === "native" || type === "sidebar-native") && containerRef.current && !injectedRef.current) {
      injectedRef.current = true;
      containerRef.current.innerHTML = "";

      const nativeScript = document.createElement("script");
      nativeScript.async = true;
      nativeScript.setAttribute("data-cfasync", "false");
      nativeScript.src =
        "https://wailsilence.com/f98e29f0e52639872d03cd647118ee6b/invoke.js";
      nativeScript.onload = () => setAdLoaded(true);

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
        src="https://wailsilence.com/9a/e9/3b/9ae93b69d11e842af1c5c33415214763.js"
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
      {/* Loading placeholder — visible until ad iframe loads */}
      {!adLoaded && (
        <div
          className={`animate-pulse bg-ink/5 border border-ink/10 rounded-lg flex items-center justify-center ${
            isTopBanner
              ? "w-full max-w-[728px] h-[90px]"
              : "w-[300px] h-[250px]"
          }`}
        >
          <span className="text-[10px] text-muted/40 font-mono uppercase tracking-widest">
            Advertisement
          </span>
        </div>
      )}
      <div
        id={id}
        ref={containerRef}
        className={`w-full flex items-center justify-center overflow-x-auto rounded-lg bg-paper border border-ink/5 shadow-sm transition-all ${
          isTopBanner
            ? "min-h-[90px] max-w-[728px] mx-auto p-1"
            : "min-h-[250px] min-w-[300px]"
        } ${!adLoaded ? "hidden" : ""}`}
      />
    </div>
  );
}
