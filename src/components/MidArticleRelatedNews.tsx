import React from "react";
import Link from "next/link";
import { INITIAL_ARTICLES } from "../lib/sample-data";

interface MidArticleRelatedNewsProps {
  currentCategory: string;
  excludeSlug: string;
}

export default function MidArticleRelatedNews({ currentCategory, excludeSlug }: MidArticleRelatedNewsProps) {
  // Find related articles, filter out current one
  const related = INITIAL_ARTICLES.filter(
    (a) => a.category === currentCategory && a.slug !== excludeSlug
  ).slice(0, 2);

  // Fallback to any articles if not enough in same category
  if (related.length === 0) {
    related.push(...INITIAL_ARTICLES.filter((a) => a.slug !== excludeSlug).slice(0, 2));
  }

  return (
    <div className="my-6 border-l-4 border-punchRed bg-punchRed/5 p-4 rounded-r shadow-sm">
      <span className="text-[10px] font-bold text-punchRed uppercase tracking-widest block mb-2 font-mono">
        Related News:
      </span>
      <ul className="space-y-2">
        {related.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/article/${a.slug}`}
              className="text-sm font-bold text-ink hover:text-punchRed transition-colors flex items-start gap-1 leading-snug"
            >
              <span className="text-punchRed shrink-0">➤</span>
              <span className="underline decoration-punchRed/30 hover:decoration-punchRed">
                {a.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
