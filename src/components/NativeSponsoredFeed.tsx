import React from "react";
import Link from "next/link";
import { NATIVE_SPONSORED_ADS } from "../lib/sample-data";

interface NativeSponsoredFeedProps {
  layout?: "grid" | "sidebar";
}

export default function NativeSponsoredFeed({ layout = "grid" }: NativeSponsoredFeedProps) {
  if (layout === "sidebar") {
    return (
      <div className="border-2 border-ink p-4 rounded bg-white my-6">
        <h4 className="font-display font-black text-xs uppercase tracking-wider text-muted border-b border-ink/10 pb-2 mb-3">
          Around the Web
        </h4>
        <div className="space-y-4">
          {NATIVE_SPONSORED_ADS.slice(0, 3).map((ad) => (
            <a
              key={ad.id}
              href={ad.targetUrl}
              className="flex gap-3 group items-start hover:opacity-90 transition-opacity"
            >
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-16 h-16 object-cover rounded border border-ink/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-black tracking-widest text-flag block mb-0.5">
                  {ad.sponsor}
                </span>
                <h5 className="text-xs font-bold font-body leading-tight text-ink group-hover:text-flag transition-colors line-clamp-2">
                  {ad.title}
                </h5>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t-4 border-ink pt-6 mt-8 font-body">
      <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-6">
        <h3 className="font-display font-black text-lg md:text-xl uppercase tracking-tight">
          Recommended For You <span className="text-muted text-xs normal-case font-body font-normal">(Sponsored Content)</span>
        </h3>
        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">Ads by Todaynews</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {NATIVE_SPONSORED_ADS.map((ad) => (
          <a
            key={ad.id}
            href={ad.targetUrl}
            className="flex flex-col group border border-ink/5 bg-white p-3 rounded shadow-sm hover:shadow transition-shadow"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded mb-3 border border-ink/5">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 bg-hazard text-ink text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow">
                {ad.badgeText || "Ad"}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <h4 className="text-sm font-bold leading-snug text-ink group-hover:text-flag transition-colors line-clamp-3">
                {ad.title}
              </h4>
              <div className="flex items-center justify-between border-t border-ink/5 mt-3 pt-2 text-[10px] text-muted font-black uppercase tracking-wider">
                <span>{ad.sponsor}</span>
                <span className="text-flag">Learn More →</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
