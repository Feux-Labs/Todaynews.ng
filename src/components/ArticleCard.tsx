import React from "react";
import Link from "next/link";
import { ArticleData } from "../lib/sample-data";

interface ArticleCardProps {
  article: ArticleData;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.createdAt).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const categoryColors: Record<string, string> = {
    POLITICS: "bg-flag text-white",
    NAIRA: "bg-naira text-white",
    ENTERTAINMENT: "bg-gist text-white",
    SPORTS: "bg-gold text-ink",
    SECURITY: "bg-signal text-white",
    METRO: "bg-ink text-paper",
  };

  const pagesCount = article.pages?.length || 1;

  return (
    <article className="flex flex-col md:flex-row gap-5 border border-ink/5 p-4 rounded bg-white shadow-sm hover:shadow transition-shadow group">
      {article.imageUrl && (
        <div className="relative aspect-video md:w-48 overflow-hidden rounded border border-ink/5 shrink-0">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
          {pagesCount > 1 && (
            <span className="absolute bottom-2 right-2 bg-ink text-paper text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-mono uppercase tracking-wider">
              📄 {pagesCount} Pages
            </span>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded ${categoryColors[article.category] || "bg-ink text-paper"}`}>
              {article.category}
            </span>
            <span className="text-[10px] text-muted font-bold">{formattedDate}</span>
          </div>

          <h3 className="font-display font-black text-base md:text-lg text-ink leading-snug group-hover:text-flag transition-colors">
            <Link href={`/article/${article.slug}`}>
              {article.title}
            </Link>
          </h3>

          <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-ink/5 mt-4 pt-2 text-[10px] text-muted font-bold uppercase tracking-wider">
          <span>By {article.author}</span>
          <span className="flex items-center gap-1">
            ⏱ {article.readTimeMinutes} Min Read
          </span>
        </div>
      </div>
    </article>
  );
}
