import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { memoryDb } from "@/lib/db";
import ArticleCard from "@/components/ArticleCard";
import { Mail, CheckCircle } from "lucide-react";

interface AuthorPageProps {
  params: { slug: string };
}

const AUTHORS: Record<string, {
  name: string;
  role: string;
  bio: string;
  email: string;
  avatar: string;
  verificationBadge: string;
}> = {
  "gideon-ibitoye": {
    name: "Gideon Ibitoye",
    role: "Chief Editor & Reviewing Authority",
    bio: "Gideon leads the editorial team at Todaynews.ng. Specializing in Nigerian political affairs, parallel currency trends, and national policy analysis, Gideon reviews all incoming stories for journalistic integrity and accuracy.",
    email: "editor@todaynews.ng",
    avatar: "GI",
    verificationBadge: "Verified Senior Editor",
  },
};

export async function generateMetadata({ params }: AuthorPageProps) {
  const author = AUTHORS[params.slug] || AUTHORS["gideon-ibitoye"];
  return {
    title: `${author.name} (${author.role}) | Todaynews.ng Editorial`,
    description: author.bio,
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const author = AUTHORS[params.slug] || AUTHORS["gideon-ibitoye"];
  
  // Fetch published articles for this author/editor
  const { articles: allArticles } = await memoryDb.getArticles(undefined, "PUBLISHED", 1, 12);
  const authorArticles = allArticles;

  const authorJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.role,
    "worksFor": {
      "@type": "NewsMediaOrganization",
      "name": "Todaynews.ng"
    },
    "description": author.bio,
    "email": author.email
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-body space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd) }}
      />

      {/* Author Header Card */}
      <div className="border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-flag/10 border-4 border-flag flex items-center justify-center font-display font-black text-3xl text-flag flex-shrink-0">
          {author.avatar}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="font-display font-black text-3xl text-ink">{author.name}</h1>
            <span className="bg-flag text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {author.verificationBadge}
            </span>
          </div>
          <p className="text-sm font-semibold text-muted">{author.role} • Todaynews.ng</p>
          <p className="text-xs text-muted leading-relaxed">{author.bio}</p>

          <div className="pt-2 flex items-center justify-center md:justify-start gap-4 text-xs font-bold">
            <a href={`mailto:${author.email}`} className="flex items-center gap-1 text-ink hover:text-flag">
              <Mail className="w-3.5 h-3.5" />
              {author.email}
            </a>
            <span className="text-muted">•</span>
            <Link href="/editorial-standards" className="text-muted hover:text-flag">
              Review Standards
            </Link>
          </div>
        </div>
      </div>

      {/* Verified Reviewed Articles */}
      <div className="space-y-6">
        <div className="border-b-2 border-ink pb-3 flex justify-between items-end">
          <div>
            <span className="text-xs font-display font-black text-flag uppercase tracking-wider">
              Verified Byline Coverage
            </span>
            <h2 className="font-display font-black text-2xl text-ink">
              Articles Reviewed & Authored by {author.name}
            </h2>
          </div>
          <span className="text-xs font-bold text-muted">{authorArticles.length} Stories</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {authorArticles.map((article: any) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </div>
  );
}
