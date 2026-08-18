export interface ArticlePageData {
  pageNumber: number;
  title?: string | null;
  content: string;
}

export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category:
    | "POLITICS"
    | "NAIRA"
    | "ENTERTAINMENT"
    | "SPORTS"
    | "SECURITY"
    | "METRO"
    | "EDUCATION"
    | "TECHNOLOGY"
    | "HEALTH"
    | "SCHOLARSHIP"
    | "JAPA"
    | "MAKE_MONEY_ONLINE";
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  sourceUrl?: string;
  sourceName?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  keywords?: string[];
  author: string;
  readTimeMinutes: number;
  views: number;
  createdAt: string;
  pages: ArticlePageData[];
}

export interface NativeAdData {
  id: string;
  title: string;
  sponsor: string;
  imageUrl: string;
  targetUrl: string;
  category: string;
  badgeText?: string;
}

export const INITIAL_NAIRA_RATES = {
  usdParallel: "₦1,610 / $1",
  usdOfficial: "₦1,595 / $1",
  gbpParallel: "₦2,080 / £1",
  eurParallel: "₦1,740 / €1",
  lastUpdated: "Just now",
};

export const NATIVE_SPONSORED_ADS: NativeAdData[] = [
  {
    id: "ad-1",
    title: "Nigerian Bettors Are Switching to This App — Here's Why",
    sponsor: "Betway Nigeria",
    imageUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop",
    targetUrl: "#",
    category: "Sports & Betting",
    badgeText: "Sponsored",
  },
  {
    id: "ad-2",
    title: "Gold Is Surging in 2026 — Smart Traders Are Already In",
    sponsor: "IC Markets",
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&auto=format&fit=crop",
    targetUrl: "#",
    category: "Trading & Wealth",
    badgeText: "Sponsored",
  },
  {
    id: "ad-3",
    title: "Too Much Belly Fat? Do This 1-Minute Routine Before Bed",
    sponsor: "Health & You",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop",
    targetUrl: "#",
    category: "Health & Living",
    badgeText: "Sponsored",
  },
  {
    id: "ad-4",
    title: "Is This Legal? Turn Any Old TV Into a Smart TV in 30 Seconds",
    sponsor: "Techno Mag",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop",
    targetUrl: "#",
    category: "Gadgets & Tech",
    badgeText: "Sponsored",
  },
  {
    id: "ad-5",
    title: "The Worst Enemy of Hypertension Is on Your Plate — Read Before Deleted",
    sponsor: "Cardizoom Nigeria",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop",
    targetUrl: "#",
    category: "Health",
    badgeText: "Sponsored",
  },
];

/**
 * No placeholder articles — site boots clean.
 * Real articles come from AI scraper and admin publishing workflow.
 */
export const INITIAL_ARTICLES: ArticleData[] = [];
