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
  // Stays false — and the slot renders nothing — until the ad network has
  // actually inserted a real ad (an iframe). The container's own min-height
  // means "has children" is NOT proof of a real ad (the config/invoke
  // <script> tags themselves count as children), so only an actual iframe
  // counts as a fill. If it never fills, the slot never shows and never
  // leaves a gap in the layout.
  const [adFilled, setAdFilled] = useState(false);

  useEffect(() => {
    if (type !== "banner" && type !== "banner-top" && type !== "in-article-mid" && type !== "native" && type !== "sidebar-native") {
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const checkFilled = () => {
      if (el.querySelector("iframe")) setAdFilled(true);
    };

    const observer = new MutationObserver(checkFilled);
    observer.observe(el, { childList: true, subtree: true });
    checkFilled();

    return () => observer.disconnect();
  }, [type]);

  // ── Banner (iframe) injection — guaranteed config-before-invoke order ────────
  useEffect(() => {
    if (
      (type === "banner" || type === "banner-top" || type === "in-article-mid") &&
      containerRef.current &&
      !injectedRef.current
    ) {
      injectedRef.current = true;
      const target = containerRef.current;
      target.innerHTML = "";

      const isWide = type === "banner-top";
      const width = isWide ? 728 : 300;
      const height = isWide ? 90 : 250;
      const key = isWide
        ? "f1676b31bf7fb91f65c368c428768a54"   // 728×90 leaderboard
        : "baec4ba691aee8e6facd331480c3ff7a";  // 300×250 rectangle
      const src = isWide
        ? "https://wailsilence.com/f1676b31bf7fb91f65c368c428768a54/invoke.js"
        : "https://wailsilence.com/baec4ba691aee8e6facd331480c3ff7a/invoke.js";

      // 1. Synchronously set window.atOptions
      (window as any).atOptions = {
        key,
        format: "iframe",
        height,
        width,
        params: {},
      };

      // 2. Add inline config script to the DOM element
      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.innerHTML = `
        window.atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      target.appendChild(configScript);

      // 3. Inject invoke script
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = src;
      invokeScript.async = true;
      invokeScript.onload = () => setAdLoaded(true);
      invokeScript.onerror = () => setAdLoaded(true);

      target.appendChild(invokeScript);
      setAdLoaded(true);
    }
  }, [type]);

  // ── Native Banner Widget injection ─────────────────────────────────────────
  useEffect(() => {
    if ((type === "native" || type === "sidebar-native") && containerRef.current && !injectedRef.current) {
      injectedRef.current = true;
      const target = containerRef.current;
      target.innerHTML = "";

      const nativeDiv = document.createElement("div");
      nativeDiv.id = "container-f98e29f0e52639872d03cd647118ee6b";
      target.appendChild(nativeDiv);

      const nativeScript = document.createElement("script");
      nativeScript.async = true;
      nativeScript.setAttribute("data-cfasync", "false");
      nativeScript.src = "https://wailsilence.com/f98e29f0e52639872d03cd647118ee6b/invoke.js";
      nativeScript.onload = () => setAdLoaded(true);
      nativeScript.onerror = () => setAdLoaded(true);

      target.appendChild(nativeScript);
      setAdLoaded(true);
    }
  }, [type]);

  // ── Smartlink strip ─────────────────────────────────────────────────────────
  if (type === "smartlink") {
    return (
      <a
        href={smartlinkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`my-3 flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold rounded-xl shadow-md hover:brightness-110 transition-all text-sm group ${className}`}
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

  // ── Popunder — headless, one per page per Adsterra's own guidance ──────────
  if (type === "popunder") {
    return (
      <Script
        id="adsterra-popunder"
        src="https://wailsilence.com/86/84/34/868434848e287f3925fb66a84554c4a8.js"
        strategy="lazyOnload"
      />
    );
  }

  // ── In-page Push — headless, not yet configured ─────────────────────────────
  if (type === "in-page-push") {
    return <div className="hidden" />;
  }

  // ── Rendered container for Banner & Native ─────────────────────────────────
  // The container (with the ref the injection effects target) must always be
  // in the DOM, but stays visually zero-footprint — no label, no border, no
  // min-height — until an iframe actually appears inside it. That way a dead
  // ad network never leaves a gap, but the slot is still there to receive
  // the ad if/when the network fills it.
  const isTopBanner = type === "banner-top";

  return (
    <div className={`w-full ${adFilled ? "my-1 flex flex-col items-center justify-center overflow-hidden" : "h-0 overflow-hidden"} ${className}`}>
      {adFilled && (
        <span className="text-[9px] uppercase font-bold tracking-widest text-muted/60 mb-0.5 font-mono">
          Sponsored Advertisement
        </span>
      )}
      <div
        id={id}
        ref={containerRef}
        className={
          adFilled
            ? `w-full flex items-center justify-center overflow-hidden rounded-lg bg-paper border border-ink/5 shadow-sm transition-all ${
                isTopBanner ? "min-h-[90px] max-w-[728px] mx-auto p-1" : "min-h-[250px] min-w-[300px]"
              }`
            : "h-0 w-0 overflow-hidden"
        }
      />
    </div>
  );
}
