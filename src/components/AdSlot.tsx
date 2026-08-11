"use client";

import React, { useEffect, useState } from "react";

interface AdSlotProps {
  id: string;
  type: "banner-top" | "in-article-mid" | "sidebar-native" | "social-bar" | "popunder";
  className?: string;
}

export default function AdSlot({ id, type, className = "" }: AdSlotProps) {
  const [debugMode, setDebugMode] = useState(true);

  // Toggle debug visualization or real script injection
  useEffect(() => {
    // Check if live script parameters exist
    const isLive = process.env.NEXT_PUBLIC_LIVE_ADS === "true";
    setDebugMode(!isLive);

    if (isLive) {
      try {
        if (type === "social-bar") {
          // Dynamic Adsterra Social Bar injection
          const script = document.createElement("script");
          script.src = "//pl21345678.highratecpm.com/ab/cd/ef/socialbar.js";
          script.async = true;
          document.body.appendChild(script);
        } else if (type === "popunder") {
          // Dynamic Adsterra Popunder injection
          const script = document.createElement("script");
          script.src = "//pl21345678.highratecpm.com/ab/cd/ef/popunder.js";
          script.async = true;
          document.body.appendChild(script);
        }
      } catch (err) {
        console.warn("Failed to inject Adsterra script:", err);
      }
    }
  }, [type]);

  if (type === "social-bar" || type === "popunder") {
    // Scripts are injected into document body, return empty component
    return debugMode ? (
      <div className="fixed bottom-2 right-2 bg-hazard text-ink text-[10px] font-bold px-2 py-1 rounded shadow z-50 border border-ink/40">
        📢 Adsterra {type === "social-bar" ? "Social Bar" : "Popunder"} Active
      </div>
    ) : null;
  }

  // Visual layout containers for banner / native slots
  const getSlotDetails = () => {
    switch (type) {
      case "banner-top":
        return {
          dimensions: "728 × 90",
          label: "Leaderboard Banner Ad (Adsterra Responsive)",
          color: "bg-flag/5 text-flag border-flag/20",
        };
      case "in-article-mid":
        return {
          dimensions: "300 × 250 / Native",
          label: "Mid-Article In-Paragraph Ad (Adsterra High CPM)",
          color: "bg-punchRed/5 text-punchRed border-punchRed/20",
        };
      case "sidebar-native":
        return {
          dimensions: "300 × 250 / Native",
          label: "Sidebar Native Ad Widget",
          color: "bg-naira/5 text-naira border-naira/20",
        };
      default:
        return {
          dimensions: "Responsive",
          label: "Display Ad Block",
          color: "bg-ink/5 text-muted border-ink/20",
        };
    }
  };

  const details = getSlotDetails();

  return (
    <div
      id={id}
      className={`w-full my-6 border border-dashed rounded flex flex-col items-center justify-center p-4 text-center ${details.color} ${className}`}
      style={{ minHeight: type === "banner-top" ? "90px" : "250px" }}
    >
      <span className="text-[10px] uppercase font-bold tracking-widest opacity-65 mb-1">
        Advertisement
      </span>
      <span className="text-xs font-semibold">{details.label}</span>
      {debugMode && (
        <span className="text-[10px] opacity-80 mt-1 font-mono">
          [Placeholder - {details.dimensions}]
        </span>
      )}
    </div>
  );
}
