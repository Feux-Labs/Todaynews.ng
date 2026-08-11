"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar } from "lucide-react";
import SocialHandles from "./SocialHandles";

const CATEGORIES = [
  { label: "Politics", slug: "politics" },
  { label: "Naira Watch", slug: "naira" },
  { label: "Entertainment", slug: "entertainment" },
  { label: "Sports", slug: "sports" },
  { label: "Security", slug: "security" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const router = useRouter();

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="border-b-4 border-ink bg-paper font-body">
      {/* --- TOP BANNER TICKER --- */}
      <div className="bg-ink text-paper overflow-hidden py-1.5 border-b border-paper/10">
        <div className="max-w-6xl mx-auto flex items-center gap-4 px-4 text-xs">
          <span className="flex items-center gap-1.5 shrink-0 font-extrabold tracking-widest uppercase text-hazard">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hazard opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hazard" />
            </span>
            Breaking
          </span>
          <div className="flex-1 overflow-hidden relative h-4">
            <div className="absolute animate-ticker whitespace-nowrap text-[11px] font-semibold">
              Naira trades steady at ₦1,595/$1 on official window • NBTE launches 1-year top-up degree programme for HND holders • Big Brother Naija nominations spark huge debate online • Super Eagles coach releases World Cup qualifier list
            </div>
          </div>
        </div>
      </div>

      {/* --- MASTHEAD LOGO ROW --- */}
      <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Brand Logo */}
        <div className="text-center md:text-left">
          <Link href="/" className="inline-block">
            <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight text-ink hover:opacity-95 transition-opacity">
              Todaynews<span className="text-flag">.ng</span>
            </h1>
          </Link>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-[10px] text-muted font-bold uppercase tracking-wider">
            <Calendar className="h-3 w-3 text-flag" />
            <span>{currentDate || "Loading Date..."}</span>
          </div>
        </div>

        {/* Center/Right Side: Search Engine & Social Handles */}
        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, Naira rates, gossip..."
              className="w-full pl-3 pr-10 py-1.5 border-2 border-ink rounded text-xs bg-white text-ink outline-none focus:border-flag transition-colors font-medium"
            />
            <button type="submit" className="absolute right-2 top-1.5 text-ink hover:text-flag transition-colors">
              <Search className="h-4.5 w-4.5" />
            </button>
          </form>
          <SocialHandles iconOnly className="justify-center md:justify-end" />
        </div>
      </div>

      {/* --- CATEGORY NAVIGATION --- */}
      <nav className="border-t border-ink/10 bg-paper">
        <div
          className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto text-xs font-black uppercase tracking-widest scrollbar-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, var(--tw-color-hazard,#F2C94C) 0 10px, transparent 10px 20px)",
            backgroundSize: "100% 3px",
            backgroundPosition: "bottom",
            backgroundRepeat: "repeat-x",
          }}
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="py-3 shrink-0 hover:text-flag border-b-2 border-transparent hover:border-flag transition-all"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
