"use client";

import React, { useEffect, useState } from "react";

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
  smartlinkUrl = process.env.NEXT_PUBLIC_ADSTERRA_SMARTLINK || "#",
  smartlinkLabel = "🔥 Trending Deals & Offers — Click Here",
  bannerSize = "728x90",
}: AdSlotProps) {
  const [debugMode, setDebugMode] = useState(true);

  useEffect(() => {
    const isLive = process.env.NEXT_PUBLIC_LIVE_ADS === "true";
    setDebugMode(!isLive);

    if (isLive) {
      try {
        if (type === "popunder") {
          const script = document.createElement("script");
          script.src = process.env.NEXT_PUBLIC_ADSTERRA_POPUNDER_SCRIPT || "//pl21345678.highratecpm.com/ab/cd/ef/popunder.js";
          script.async = true;
          document.body.appendChild(script);
        } else if (type === "social-bar") {
          const script = document.createElement("script");
          script.src = process.env.NEXT_PUBLIC_ADSTERRA_SOCIALBAR_SCRIPT || "//pl21345678.highratecpm.com/ab/cd/ef/socialbar.js";
          script.async = true;
          document.body.appendChild(script);
        } else if (type === "in-page-push") {
          const script = document.createElement("script");
          script.src = process.env.NEXT_PUBLIC_ADSTERRA_PUSH_SCRIPT || "//pl21345678.highratecpm.com/ab/cd/ef/inpagepush.js";
          script.async = true;
          document.body.appendChild(script);
        } else if (type === "interstitial") {
          const script = document.createElement("script");
          script.src = process.env.NEXT_PUBLIC_ADSTERRA_INTERSTITIAL_SCRIPT || "//pl21345678.highratecpm.com/ab/cd/ef/interstitial.js";
          script.async = true;
          document.body.appendChild(script);
        }
      } catch (err) {
        console.warn("[Adsterra] Failed to inject ad script:", err);
      }
    }
  }, [type]);

  // Handle Smartlink format
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

  // Handle script-injected background overlay formats
  if (type === "popunder" || type === "social-bar" || type === "in-page-push" || type === "interstitial") {
    return debugMode ? (
      <div className="fixed bottom-3 right-3 bg-[#0a0f1c] text-[#00e676] text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl z-50 border border-[#00e676]/30 flex items-center gap-2">
        <span className="w-2 h-2 bg-[#00e676] rounded-full animate-pulse" />
        Adsterra {type.toUpperCase()} Active (High CPM)
      </div>
    ) : null;
  }

  // Handle Banner and Native display formats
  const getSlotDetails = () => {
    switch (type) {
      case "banner":
      case "banner-top":
        return {
          dimensions: bannerSize,
          label: `Adsterra Display Banner (${bannerSize})`,
          color: "bg-[#00e676]/5 text-[#00e676] border-[#00e676]/20",
        };
      case "native":
      case "in-article-mid":
      case "sidebar-native":
        return {
          dimensions: "Native Widget / Responsive",
          label: "Adsterra Native Recommendation Feed",
          color: "bg-blue-500/5 text-blue-400 border-blue-500/20",
        };
      default:
        return {
          dimensions: "Responsive",
          label: "Adsterra Display Unit",
          color: "bg-slate-500/5 text-slate-400 border-slate-500/20",
        };
    }
  };

  const details = getSlotDetails();

  return (
    <div
      id={id}
      className={`w-full my-6 border border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center ${details.color} ${className}`}
      style={{ minHeight: bannerSize === "728x90" ? "90px" : "250px" }}
    >
      <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">
        Sponsored Advertisement
      </span>
      <span className="text-xs font-semibold">{details.label}</span>
      {debugMode && (
        <span className="text-[10px] opacity-75 mt-1 font-mono">
          [Adsterra {type} - {details.dimensions}]
        </span>
      )}
    </div>
  );
}
