"use client";

import { useEffect } from "react";

export default function PageViewBeacon({ slug, category }: { slug: string; category: string }) {
  useEffect(() => {
    try {
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, category }),
      }).catch(() => {});
    } catch {}
  }, [slug, category]);

  return null;
}
