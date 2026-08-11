import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slug: string;
  nextPageTitle?: string;
}

export default function Pagination({ currentPage, totalPages, slug, nextPageTitle }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <div className="my-8 border-t-2 border-ink/10 pt-6">
      {/* Large Next Page Call-To-Action Box (Classic multi-page ad-arbitrage trigger) */}
      {nextPage && (
        <Link
          href={`/article/${slug}?page=${nextPage}`}
          className="block w-full bg-ink text-paper hover:bg-flag transition-all p-5 rounded border-2 border-ink text-center shadow-lg group mb-6 hover:translate-y-[-2px]"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest text-hazard block mb-1">
            Continue Reading Below
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-display font-black text-lg md:text-xl group-hover:underline">
              Next Page: {nextPageTitle || `Page ${nextPage} of ${totalPages}`}
            </span>
            <ArrowRight className="h-5 w-5 text-hazard group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      {/* Numerical Navigation & Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          {prevPage ? (
            <Link
              href={`/article/${slug}?page=${prevPage}`}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-ink rounded font-bold text-xs hover:bg-ink hover:text-paper transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Prev Page</span>
            </Link>
          ) : (
            <span className="opacity-30 cursor-not-allowed flex items-center gap-1.5 px-4 py-2 border border-ink/20 rounded font-bold text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Prev Page</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            const isActive = pageNum === currentPage;

            return (
              <Link
                key={pageNum}
                href={`/article/${slug}?page=${pageNum}`}
                className={`w-9 h-9 rounded font-mono text-xs font-black flex items-center justify-center border-2 transition-all ${
                  isActive
                    ? "bg-flag border-flag text-white scale-105"
                    : "border-ink hover:bg-ink hover:text-paper"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>

        <div>
          {nextPage ? (
            <Link
              href={`/article/${slug}?page=${nextPage}`}
              className="flex items-center gap-1.5 px-4 py-2 border-2 border-ink rounded font-bold text-xs hover:bg-ink hover:text-paper transition-all"
            >
              <span>Next Page</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="opacity-30 cursor-not-allowed flex items-center gap-1.5 px-4 py-2 border border-ink/20 rounded font-bold text-xs">
              <span>Next Page</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <div className="text-center text-[10px] text-muted font-bold uppercase tracking-wider mt-4">
        Reading Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
