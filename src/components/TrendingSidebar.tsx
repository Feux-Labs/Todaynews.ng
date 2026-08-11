import React from "react";
import Link from "next/link";
import { INITIAL_ARTICLES } from "../lib/sample-data";

export default function TrendingSidebar() {
  // Sort articles by views count descending
  const topArticles = [...INITIAL_ARTICLES]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div className="border-2 border-ink p-5 rounded bg-white font-body shadow-sm">
      <h3 className="font-display font-black text-sm uppercase tracking-wider text-ink border-b-2 border-ink pb-2 mb-4 flex items-center gap-1">
        <span>Trending Wahala</span>
        <span className="text-signal text-xs animate-bounce font-mono bg-signal/10 px-1 py-0.5 rounded">
          Top 5
        </span>
      </h3>

      <div className="space-y-4">
        {topArticles.map((article, idx) => {
          const formattedViews =
            article.views >= 1000
              ? `${(article.views / 1000).toFixed(1)}k`
              : article.views;

          return (
            <div key={article.slug} className="flex gap-3 group items-start">
              {/* Leaderboard Number Badge */}
              <div className="w-6 h-6 rounded-full bg-ink text-paper text-xs font-black flex items-center justify-center shrink-0 font-mono">
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] uppercase font-black tracking-widest text-flag">
                    {article.category}
                  </span>
                  <span className="text-[9px] font-bold text-muted flex items-center gap-0.5">
                    🔥 {formattedViews} views
                  </span>
                </div>

                <Link
                  href={`/article/${article.slug}`}
                  className="text-xs font-bold leading-snug text-ink group-hover:text-flag transition-colors line-clamp-2 underline decoration-ink/10 group-hover:decoration-flag"
                >
                  {article.title}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
