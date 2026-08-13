"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Calendar, ShieldCheck, Rss, Bell } from "lucide-react";
import SocialHandles from "./SocialHandles";

const CATEGORIES = [
  { label: "Home", slug: "" },
  { label: "Politics", slug: "politics" },
  { label: "Security & Metro", slug: "security" },
  { label: "Naira & Business", slug: "naira" },
  { label: "Sports", slug: "sports" },
  { label: "Entertainment", slug: "entertainment" },
  { label: "Technology", slug: "technology" },
  { label: "Education", slug: "education" },
  { label: "Health", slug: "health" },
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
      {/* --- TOP PUNCH-STYLE UTILITY STRIP --- */}
      <div className="bg-ink text-paper/80 text-[11px] py-1 border-b border-paper/10 font-bold">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-hazard">
              <Calendar className="h-3 w-3" />
              {currentDate || "Loading Date..."}
            </span>
            <span className="hidden sm:inline text-paper/40">|</span>
            <span className="hidden sm:inline text-paper/90">
              Nigeria's AI-Powered Independent News Channel
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-paper/70">
            <Link href="/about" className="hover:text-hazard transition-colors">About Us</Link>
            <Link href="/editorial-standards" className="hover:text-hazard transition-colors">Ethics Policy</Link>
            <Link href="/contact" className="hover:text-hazard transition-colors">Contact</Link>
            <Link href="/sitemap-news.xml" className="hover:text-hazard transition-colors text-hazard flex items-center gap-1">
              <Rss className="h-3 w-3 inline" /> News Feed XML
            </Link>
          </div>
        </div>
      </div>

      {/* --- BREAKING TICKER STRIP --- */}
      <div className="bg-punchRed text-white overflow-hidden py-1.5 border-b border-ink/10">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 shrink-0 uppercase tracking-widest bg-ink px-2 py-0.5 rounded text-[10px] text-paper">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hazard opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-hazard" />
            </span>
            Breaking News
          </span>
          <div className="flex-1 overflow-hidden relative h-4">
            <div className="absolute animate-ticker whitespace-nowrap text-[11px] font-semibold">
              Naira trades steady at ₦1,595/$1 on official window • Security forces rescue 9 kidnapped victims in Kogi • NBTE launches 1-year top-up degree programme for HND holders • Big Brother Naija nominations spark online debate • Super Eagles coach releases World Cup qualifier list
            </div>
          </div>
        </div>
      </div>

      {/* --- MASTHEAD LOGO ROW --- */}
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Side: Brand Logo */}
        <div className="text-center md:text-left">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo.png"
              alt="Todaynews.ng - Nigeria's AI-Powered Independent News Channel"
              width={300}
              height={80}
              priority
              className="h-auto w-auto max-w-xs hover:opacity-95 transition-opacity"
            />
          </Link>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-[10px] text-muted font-black uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-flag fill-current" />
            <span>AI-Driven Anti-Censorship & Misinformation Defense</span>
          </div>
        </div>

        {/* Center/Right Side: Search Engine & Social Handles */}
        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, security updates, Naira rates..."
              className="w-full pl-3 pr-10 py-1.5 border-2 border-ink rounded text-xs bg-white text-ink outline-none focus:border-flag transition-colors font-medium shadow-sm"
            />
            <button type="submit" className="absolute right-2 top-1.5 text-ink hover:text-flag transition-colors">
              <Search className="h-4.5 w-4.5" />
            </button>
          </form>
          <SocialHandles iconOnly className="justify-center md:justify-end" />
        </div>
      </div>

      {/* --- CATEGORY NAVIGATION BAR --- */}
      <nav className="border-t-2 border-ink bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 sm:gap-2 overflow-x-auto text-xs font-black uppercase tracking-wider scrollbar-none py-1">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug || "home"}
              href={c.slug ? `/category/${c.slug}` : "/"}
              className="px-3 py-2 shrink-0 text-paper/90 hover:text-hazard hover:bg-white/10 rounded transition-all"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
