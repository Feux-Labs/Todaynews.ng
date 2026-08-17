import React from "react";

import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { ShieldCheck, Users, Globe, BookOpen, Award, CheckCircle } from "lucide-react";

export const metadata = {
  title: "About Us | Todaynews.ng - AI-Powered Nigerian News Channel",
  description: "Todaynews.ng is a Nigerian AI-powered news channel focusing on reducing misinformation and news censorship by using complex algorithms to locate important news, especially security-related news, in order to keep Nigerians safe.",
};

export default function AboutPage() {
  const newsOrgJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "name": "Todaynews.ng",
    "url": "https://todaynews.ng",
    "logo": "https://todaynews.ng/images/logo.png",
    "sameAs": [
      "https://facebook.com/todaynewsng",
      "https://twitter.com/todaynewsng",
      "https://instagram.com/todaynewsng"
    ],
    "publishingPrinciples": "https://todaynews.ng/editorial-standards",
    "correctionsPolicy": "https://todaynews.ng/editorial-standards#corrections",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressCountry": "NG"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "editorial",
      "email": "editor@todaynews.ng"
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-body space-y-10">
      <JsonLd schema={newsOrgJsonLd} />

      {/* Header Banner */}
      <div className="border-b-4 border-ink pb-6">
        <span className="bg-flag text-white text-xs font-display font-black px-3 py-1 uppercase tracking-wider rounded">
          About Todaynews.ng
        </span>
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-ink mt-3">
          AI-Powered News Channel For Nigeria
        </h1>
        <p className="text-muted text-lg mt-3 leading-relaxed">
          Reducing misinformation and news censorship through complex algorithms to locate critical news — especially security-related updates — to keep Nigerians safe.
        </p>
      </div>

      {/* Mission & Purpose */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal">
          <Globe className="w-8 h-8 text-flag mb-3" />
          <h2 className="font-display font-black text-xl text-ink mb-2">Our Mission</h2>
          <p className="text-sm text-muted leading-relaxed">
            Todaynews.ng is a Nigerian AI-powered news channel focusing on reducing misinformation and news censorship by using complex algorithms to locate important news — especially security-related news — in order to keep Nigerians safe, as well as covering all other news forms across politics, economy, culture, and sports.
          </p>
        </div>

        <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal">
          <ShieldCheck className="w-8 h-8 text-flag mb-3" />
          <h2 className="font-display font-black text-xl text-ink mb-2">Anti-Censorship & Editorial Rigor</h2>
          <p className="text-sm text-muted leading-relaxed">
            By leveraging automated intelligence gathering combined with 100% human editorial verification, we bypass information bottlenecks and censorship to ensure high-priority public safety alerts reach citizens fast without distortion.
          </p>
        </div>
      </div>

      {/* Coverage Pillars */}
      <div className="space-y-4">
        <h2 className="font-display font-black text-2xl text-ink border-b border-ink/20 pb-2">
          What We Cover
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-ink/20 rounded bg-paper">
            <h3 className="font-bold text-ink mb-1">🏛️ Politics & Governance</h3>
            <p className="text-xs text-muted">National Assembly, Presidency, CBN policies, state statecraft & elections.</p>
          </div>
          <div className="p-4 border border-ink/20 rounded bg-paper">
            <h3 className="font-bold text-ink mb-1">💵 Naira Watch & Economy</h3>
            <p className="text-xs text-muted">Daily AbokiFX parallel market rates, inflation metrics, oil & gas, stock exchange.</p>
          </div>
          <div className="p-4 border border-ink/20 rounded bg-paper">
            <h3 className="font-bold text-ink mb-1">⚽ Sports & Entertainment</h3>
            <p className="text-xs text-muted">Super Eagles, NPFL, European leagues, Afrobeats, Nollywood & pop culture gist.</p>
          </div>
        </div>
      </div>

      {/* Leadership & Editors */}
      <div className="space-y-4 border-t border-ink/20 pt-8">
        <h2 className="font-display font-black text-2xl text-ink">Editorial Leadership</h2>
        <p className="text-sm text-muted">
          Our newsroom is driven by veteran journalists and digital news specialists dedicated to preserving freedom of information.
        </p>

        <div className="border-2 border-ink p-6 rounded-lg bg-paper flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-flag/10 border-2 border-flag flex items-center justify-center font-display font-black text-2xl text-flag flex-shrink-0">
            TN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xl text-ink">TodaynewsAi</h3>
              <span className="bg-ink text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">AI Editorial System</span>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Running the digital newsdesk at Todaynews.ng, TodaynewsAi drafts every story from verified sources, applies fact-verification protocols, and covers policy reporting across Nigeria's 36 states — with human editors reviewing before publish.
            </p>
            <div className="mt-3 flex gap-4 text-xs font-bold">
              <Link href="/author/todaynewsai" className="text-flag hover:underline">
                View Published & Reviewed Articles →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Transparency CTA */}
      <div className="border border-ink/20 p-6 rounded bg-paper flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-ink">Want to know more about our standards?</h3>
          <p className="text-xs text-muted">Read our corrections policy, ethical guidelines, and reporting framework.</p>
        </div>
        <Link href="/editorial-standards" className="bg-ink text-paper font-display font-bold text-xs uppercase px-4 py-2 rounded hover:bg-flag transition-colors text-center whitespace-nowrap">
          Editorial Standards & Policy
        </Link>
      </div>
    </div>
  );
}
