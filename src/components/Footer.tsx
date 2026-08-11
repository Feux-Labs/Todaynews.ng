import React from "react";
import Link from "next/link";
import SocialHandles from "./SocialHandles";

export default function Footer() {
  const categories = [
    { label: "Politics News", href: "/category/politics" },
    { label: "Naira Watch & Exchange", href: "/category/naira" },
    { label: "Entertainment Gist", href: "/category/entertainment" },
    { label: "Sports Live", href: "/category/sports" },
    { label: "National Security", href: "/category/security" },
  ];

  return (
    <footer className="border-t-4 border-ink bg-paper pt-12 pb-6 mt-16 font-body">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-ink/10">
        
        {/* Left Column: Brand & Bio */}
        <div>
          <Link href="/">
            <span className="font-display font-black text-2xl tracking-tight text-ink">
              Todaynews<span className="text-flag">.ng</span>
            </span>
          </Link>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Nigeria's fast-growing digital news hub. We supply trending national news, parallel Naira currency indicators, sports updates, and hot entertainment gist reviewed for highest authenticity.
          </p>
          <div className="mt-4">
            <SocialHandles iconOnly />
          </div>
        </div>

        {/* Center Column: Categories Directory */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b border-ink/10">
            Categories Index
          </h4>
          <ul className="grid grid-cols-1 gap-2 text-xs font-bold text-muted">
            {categories.map((cat) => (
              <li key={cat.label}>
                <Link href={cat.href} className="hover:text-flag transition-colors">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Disclaimer & Contact */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b border-ink/10">
            Editorial Guidelines
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Todaynews.ng operates under rigorous journalistic ethics. All AI-rewritten drafts undergo 100% human-editor reviews, verification, and copy-editing before deployment.
          </p>
          <div className="mt-4 text-xs font-semibold text-ink">
            <span>Contact: </span>
            <a href="mailto:editor@todaynews.ng" className="underline hover:text-flag transition-colors">
              editor@todaynews.ng
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal Row */}
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted font-bold uppercase tracking-wider">
        <span>
          © {new Date().getFullYear()} Todaynews.ng Limited. All rights reserved.
        </span>
        <div className="flex gap-4">
          <Link href="/admin" className="hover:text-flag transition-colors underline">
            Editor Login Portal
          </Link>
          <Link href="#" className="hover:text-flag transition-colors">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-flag transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
