"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArticleData } from "../lib/sample-data";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  POLITICS: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80",
  NAIRA: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  ENTERTAINMENT: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
  SPORTS: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
  SECURITY: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
  METRO: "https://images.unsplash.com/photo-1577975882846-431adc8c2009?auto=format&fit=crop&w=800&q=80",
  EDUCATION: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  TECHNOLOGY: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
  HEALTH: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
  SCHOLARSHIP: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  JAPA: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
  MAKE_MONEY_ONLINE: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  DEFAULT: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
};

interface ArticleCardProps {
  article: ArticleData;
}

function cleanSummary(text?: string): string {
  if (!text) return "";
  return text
    .replace(/Read More:?\s*https?:\/\/[^\s]+/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/The post .* appeared first on .*/gi, "")
    .replace(/Copyright © .*/gi, "")
    .trim();
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const defaultFallback = CATEGORY_FALLBACK_IMAGES[article.category] || CATEGORY_FALLBACK_IMAGES.DEFAULT;
  const [imgSrc, setImgSrc] = useState(article.imageUrl || defaultFallback);

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
  const sanitizedSummary = cleanSummary(article.summary);

  return (
    <article className="flex flex-col sm:flex-row gap-4 border border-ink/10 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-all group">
      {/* Featured Thumbnail */}
      <div className="relative aspect-video sm:w-48 sm:h-32 overflow-hidden rounded-md border border-ink/5 shrink-0 bg-ink/5">
        <img
          src={imgSrc}
          alt={article.title}
          onError={() => setImgSrc(defaultFallback)}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {pagesCount > 1 && (
          <span className="absolute bottom-2 right-2 bg-ink/90 backdrop-blur-sm text-paper text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-1 font-mono uppercase tracking-wider">
            📄 {pagesCount} Pages
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded font-mono ${categoryColors[article.category] || "bg-ink text-paper"}`}>
              {article.category}
            </span>
            <span className="text-[10px] text-muted font-bold">{formattedDate}</span>
          </div>

          <h3 className="font-display font-black text-base md:text-lg text-ink leading-snug group-hover:text-flag transition-colors">
            <Link href={`/article/${article.slug}`}>
              {article.title}
            </Link>
          </h3>

          {sanitizedSummary && (
            <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
              {sanitizedSummary}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink/5 mt-3 pt-2 text-[10px] text-muted font-bold uppercase tracking-wider">
          <span>By {article.author || "Todaynews AI"}</span>
          <span className="flex items-center gap-1">
            ⏱ {article.readTimeMinutes || 3} Min Read
          </span>
        </div>
      </div>
    </article>
  );
}
