import React from "react";
import Link from "next/link";
import NewsletterBox from "./NewsletterBox";
import SocialHandles from "./SocialHandles";

export default function Footer() {
  const newsCategories = [
    { label: "Politics & Statecraft", href: "/category/politics" },
    { label: "Security & Metro Reports", href: "/category/security" },
    { label: "Naira & Parallel Market", href: "/category/naira" },
    { label: "Sports Live & NPFL", href: "/category/sports" },
    { label: "Entertainment & Afrobeats", href: "/category/entertainment" },
  ];

  const secondaryCategories = [
    { label: "Technology & AI", href: "/category/technology" },
    { label: "Education & Campus News", href: "/category/education" },
    { label: "Health & Wellness", href: "/category/health" },
    { label: "Editorials & Columns", href: "/editorial-standards" },
    { label: "Google News Feed", href: "/sitemap-news.xml" },
  ];

  const trustLinks = [
    { label: "About Todaynews.ng", href: "/about" },
    { label: "Editorial Standards & Policy", href: "/editorial-standards" },
    { label: "Contact Newsdesk", href: "/contact" },
    { label: "Chief Editor Profile", href: "/author/gideon-ibitoye" },
    { label: "Privacy & Terms", href: "/editorial-standards" },
  ];

  return (
    <footer className="border-t-4 border-ink bg-paper pt-6 pb-6 mt-8 font-body">
      {/* Newsletter Subscription Section */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <NewsletterBox />
      </div>

      {/* Main Footer Links Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-8 border-b border-ink/10">

        {/* Column 1 & 2: Brand & Mission Statement */}
        <div className="sm:col-span-2 md:col-span-2 space-y-3">
          <Link href="/">
            <span className="font-display font-black text-2xl tracking-tight text-ink">
              Todaynews<span className="text-flag">.ng</span>
            </span>
          </Link>
          <p className="text-xs text-muted leading-relaxed">
            Todaynews.ng is Nigeria's AI-powered independent news channel focusing on reducing misinformation and news censorship using complex algorithms to locate important news — especially security-related news — in order to keep Nigerians safe.
          </p>
          <div className="pt-2">
            <SocialHandles iconOnly />
          </div>
        </div>

        {/* Column 3: News Sections */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b-2 border-flag">
            Main Desk
          </h4>
          <ul className="grid grid-cols-1 gap-2 text-xs font-bold text-muted">
            {newsCategories.map((cat) => (
              <li key={cat.label}>
                <Link href={cat.href} className="hover:text-flag transition-colors">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Specialty Desks */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b-2 border-flag">
            Special Desks
          </h4>
          <ul className="grid grid-cols-1 gap-2 text-xs font-bold text-muted">
            {secondaryCategories.map((cat) => (
              <li key={cat.label}>
                <Link href={cat.href} className="hover:text-flag transition-colors">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 5: Governance & Trust */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b-2 border-flag">
            Trust & Governance
          </h4>
          <ul className="grid grid-cols-1 gap-2 text-xs font-bold text-muted">
            {trustLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-flag transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Legal Row */}
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted font-bold uppercase tracking-wider">
        <span>
          © {new Date().getFullYear()} Todaynews.ng Limited. All rights reserved.
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-flag transition-colors">About Us</Link>
          <Link href="/editorial-standards" className="hover:text-flag transition-colors">Ethics Policy</Link>
          <Link href="/contact" className="hover:text-flag transition-colors">Contact</Link>
          <Link href="/sitemap.xml" className="hover:text-flag transition-colors">Main Sitemap</Link>
          <Link href="/sitemap-news.xml" className="hover:text-flag transition-colors text-flag">Google News XML</Link>
        </div>
      </div>
    </footer>
  );
}
