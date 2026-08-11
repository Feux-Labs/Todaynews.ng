import React from "react";
import Link from "next/link";
import { ShieldCheck, RefreshCw, FileText, CheckCircle2, AlertTriangle, Scale } from "lucide-react";

export const metadata = {
  title: "Editorial Standards & Corrections Policy | Todaynews.ng",
  description: "Read Todaynews.ng's editorial guidelines, fact-checking procedures, AI-assisted newsroom policies, and corrections handling standards.",
};

export default function EditorialStandardsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-body space-y-10">
      {/* Header */}
      <div className="border-b-4 border-ink pb-6">
        <span className="bg-ink text-paper text-xs font-display font-black px-3 py-1 uppercase tracking-wider rounded">
          Journalistic Policy
        </span>
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-ink mt-3">
          Editorial Standards & Corrections Policy
        </h1>
        <p className="text-muted text-lg mt-3 leading-relaxed">
          Our commitment to truth, accuracy, independence, and accountability across every article published on Todaynews.ng.
        </p>
      </div>

      {/* Principles Section */}
      <div className="space-y-6">
        <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-flag" />
            <h2 className="font-display font-black text-xl text-ink">1. Fact Verification & Multi-Sourcing</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Todaynews.ng requires all news stories to be cross-verified across at least two independent primary or secondary sources before publication. Unverified breaking developments are clearly marked with qualifying legal language such as <em>"allegedly"</em>, <em>"according to preliminary reports"</em>, or <em>"subject to official confirmation"</em>.
          </p>
        </div>

        <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-flag" />
            <h2 className="font-display font-black text-xl text-ink">2. Anti-Misinformation, Anti-Censorship & AI Algorithms</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Todaynews.ng operates as an AI-powered news channel focused on reducing misinformation and news censorship across Nigeria. We utilize complex algorithms to locate important news — with specialized emphasis on security-related news — in order to keep Nigerians safe. While automated intelligence gathering assists rapid drafting, <strong>every article undergoes rigorous 100% human-editor verification and approval</strong> prior to publication.
          </p>
        </div>

        <div id="corrections" className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal space-y-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-7 h-7 text-flag" />
            <h2 className="font-display font-black text-xl text-ink">3. Transparent Corrections & Updates Policy</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            When factual errors or typographical inaccuracies occur, we correct them swiftly and transparently:
          </p>
          <ul className="list-disc list-inside text-sm text-muted space-y-2 pl-2">
            <li><strong>Minor Updates:</strong> Spelling or grammatical fixes are corrected directly without altering the fundamental reporting.</li>
            <li><strong>Factual Corrections:</strong> If a substantial error is discovered, an explicit <em>"CORRECTION"</em> note is appended to the top or bottom of the article specifying what was corrected and when.</li>
            <li><strong>Developing News:</strong> As breaking stories unfold, articles are updated with a visible timestamp indicating the latest revision time.</li>
          </ul>
        </div>

        <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="w-7 h-7 text-flag" />
            <h2 className="font-display font-black text-xl text-ink">4. Independence, Attribution & Fair Use</h2>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Todaynews.ng is strictly non-partisan and independent of political or financial influences. External quotes, press statements, and third-party data (e.g. Central Bank rates, security advisories) are attributed clearly to their originating institutions.
          </p>
        </div>
      </div>

      {/* Contact for Corrections */}
      <div className="border border-ink/20 p-6 rounded bg-paper flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-ink">Spot an error or have a correction request?</h3>
          <p className="text-xs text-muted">Email our desk directly at editor@todaynews.ng with article URL and details.</p>
        </div>
        <Link href="/contact" className="bg-ink text-paper font-display font-bold text-xs uppercase px-4 py-2 rounded hover:bg-flag transition-colors text-center whitespace-nowrap">
          Submit Correction Request
        </Link>
      </div>
    </div>
  );
}
