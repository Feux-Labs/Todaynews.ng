import React from "react";
import Link from "next/link";
import { INITIAL_ARTICLES } from "../lib/sample-data";
import { Clock, ArrowRight } from "lucide-react";

interface MidArticleRelatedNewsProps {
  currentCategory: string;
  excludeSlug: string;
}

export default function MidArticleRelatedNews({ currentCategory, excludeSlug }: MidArticleRelatedNewsProps) {
  // Find related articles, filter out current one
  let related = INITIAL_ARTICLES.filter(
    (a) => a.category === currentCategory && a.slug !== excludeSlug
  ).slice(0, 3);

  // Fallback to any articles if not enough in same category
  if (related.length < 3) {
    const fallback = INITIAL_ARTICLES.filter(
      (a) => a.slug !== excludeSlug && !related.some((r) => r.slug === a.slug)
    ).slice(0, 3 - related.length);
    related = [...related, ...fallback];
  }

  return (
    <div className="my-6 border-l-4 border-flag bg-flag/5 p-4 rounded-r shadow-sm font-body">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-display font-black text-flag uppercase tracking-widest block font-mono">
          Related Coverage & Timeline Links:
        </span>
        <span className="text-[9px] font-bold text-muted uppercase">Todaynews.ng Internal Archive</span>
      </div>
      <ul className="space-y-2.5">
        {related.map((a) => (
          <li key={a.slug} className="border-b border-ink/5 pb-2 last:border-0 last:pb-0">
            <Link
              href={`/article/${a.slug}`}
              className="group text-sm font-bold text-ink hover:text-flag transition-colors flex items-start justify-between gap-2 leading-snug"
            >
              <div className="flex items-start gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-flag shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                <span className="underline decoration-flag/30 group-hover:decoration-flag">
                  {a.title}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-muted whitespace-nowrap flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {new Date(a.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
