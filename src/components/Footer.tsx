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
    { label: "Technology & AI", href: "/category/technology" },
  ];

  const trustLinks = [
    { label: "About Us", href: "/about" },
    { label: "Editorial Standards & Policy", href: "/editorial-standards" },
    { label: "Contact Newsdesk", href: "/contact" },
    { label: "Chief Editor Profile", href: "/author/gideon-ibitoye" },
  ];

  return (
    <footer className="border-t-4 border-ink bg-paper pt-12 pb-6 mt-16 font-body">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-ink/10">
        
        {/* Column 1: Brand & Bio */}
        <div className="md:col-span-1">
          <Link href="/">
            <span className="font-display font-black text-2xl tracking-tight text-ink">
              Todaynews<span className="text-flag">.ng</span>
            </span>
          </Link>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Nigeria's independent digital news hub. Delivering breaking politics, parallel market Naira updates, sports coverage, and entertainment gist with human-reviewed journalistic rigor.
          </p>
          <div className="mt-4">
            <SocialHandles iconOnly />
          </div>
        </div>

        {/* Column 2: Categories Directory */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b border-ink/10">
            News Categories
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

        {/* Column 3: Trust & Editorial Governance */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b border-ink/10">
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

        {/* Column 4: Contact & Verification Statement */}
        <div>
          <h4 className="font-display font-black text-xs uppercase tracking-wider text-ink mb-3 pb-1.5 border-b border-ink/10">
            Editorial Integrity
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Todaynews.ng operates under strict journalistic standards. All AI-assisted drafts undergo 100% human editor verification before indexing.
          </p>
          <div className="mt-4 text-xs font-semibold text-ink">
            <span>Newsdesk: </span>
            <a href="mailto:editor@todaynews.ng" className="underline hover:text-flag transition-colors">
              editor@todaynews.ng
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Legal Row — NO admin links visible to public */}
      <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-muted font-bold uppercase tracking-wider">
        <span>
          © {new Date().getFullYear()} Todaynews.ng Limited. All rights reserved.
        </span>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-flag transition-colors">About</Link>
          <Link href="/editorial-standards" className="hover:text-flag transition-colors">Ethics Policy</Link>
          <Link href="/contact" className="hover:text-flag transition-colors">Contact</Link>
          <Link href="/sitemap.xml" className="hover:text-flag transition-colors">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
}
