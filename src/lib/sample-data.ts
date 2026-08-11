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
  category: "POLITICS" | "NAIRA" | "ENTERTAINMENT" | "SPORTS" | "SECURITY" | "METRO" | "EDUCATION" | "TECHNOLOGY" | "HEALTH";
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  sourceUrl?: string;
  sourceName?: string;
  imageUrl?: string;
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

export const INITIAL_ARTICLES: ArticleData[] = [
  {
    id: "art-1",
    title: "How to Convert Your HND Certificate to BSc Through NBTE's One-Year Top-Up Programme",
    slug: "convert-hnd-certificate-to-bsc-nbte-programme",
    summary: "The National Board for Technical Education (NBTE) has launched an online top-up programme for Higher National Diploma holders to convert their HND to a Bachelor's Degree within one year.",
    category: "POLITICS",
    status: "PUBLISHED",
    sourceName: "Education Bureau",
    author: "Adekunle Sulaimon",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop",
    readTimeMinutes: 4,
    views: 24890,
    createdAt: "2026-08-11T10:30:00Z",
    pages: [
      {
        pageNumber: 1,
        title: "Requirements & NBTE Official Announcement",
        content: `
<p class="mb-4">The National Board for Technical Education (NBTE) has unveiled an online top-up programme for Higher National Diploma (HND) holders to convert their certification to a Bachelor's Degree (BSc) through a streamlined one-year online curriculum with foreign accredited universities.</p>

<p class="mb-4">The announcement was confirmed in Abuja by Mrs. Fatima Abubakar, Head of the NBTE Media Unit, who emphasized that the initiative aims to bridge the long-standing dichotomy between polytechnic HND graduates and university BSc holders in the Nigerian civil service and private sector.</p>

<div class="my-6 p-4 bg-amber-50 border-l-4 border-hazard rounded shadow-sm">
  <h4 class="font-bold text-ink mb-1">Key Eligibility Criteria:</h4>
  <ul class="list-disc pl-5 space-y-1 text-sm">
    <li>Must possess a valid HND certificate from a recognized Nigerian Polytechnic or Monotechnic.</li>
    <li>NYSC Discharge Certificate or Exemption letter is mandatory.</li>
    <li>Selected university degree path must align with the technical discipline covered in your HND program.</li>
  </ul>
</div>

<p class="mb-4">For years, polytechnic graduates have decried career stagnation and ceiling limits on grade levels in federal ministries. This NBTE partnership opens direct progression pathways to Master's degrees and PhDs worldwide.</p>
        `,
      },
      {
        pageNumber: 2,
        title: "Step-by-Step Portal Registration & Submission Guide",
        content: `
<p class="mb-4">Converting your HND to a university degree follows a structured digital process on the official NBTE admission portal. Follow these exact steps:</p>

<ol class="list-decimal pl-5 space-y-3 mb-6 font-medium">
  <li>Visit the official NBTE top-up portal at <code class="bg-ink/10 px-1.5 py-0.5 rounded text-punchRed">admission.topup.nbte.gov.ng</code> and register a new user profile.</li>
  <li>Input your personal information alongside complete academic details of your completed HND program.</li>
  <li>Upload clear scanned copies of your O'Level results, HND Statement of Result, and NYSC certificate.</li>
  <li>Select your preferred university institution from the list of accredited foreign partner universities offering the program.</li>
  <li>Review tuition structure and submit your application for processing under the 'My Applications' tab.</li>
</ol>

<p class="mb-4">Processing time typically takes between 14 to 21 business days, after which successful candidates receive an official University Admission Letter for direct entry into the top-up year.</p>
        `,
      },
      {
        pageNumber: 3,
        title: "Fees, Course Duration & What Happens After Graduation",
        content: `
<p class="mb-4">The application fee is standardized at <strong>$100 USD (payable in Naira equivalent)</strong>. Tuition fees vary slightly by institution and course discipline, payable in flexible quarterly installments.</p>

<p class="mb-4">Lectures are conducted 100% online through interactive virtual learning environments, allowing working professionals across Nigeria to retain full-time jobs while earning their degree within 12 calendar months.</p>

<div class="p-4 bg-pepper/10 border-l-4 border-pepper rounded my-6">
  <p class="font-semibold text-pepper">Important Note on NYSC & Equivalence:</p>
  <p class="text-sm text-ink/90 mt-1">Graduates who already completed NYSC with their HND do not need to repeat service. The converted BSc degree is recognized by the Federal Ministry of Education for career advancement and postgraduate university admissions globally.</p>
</div>

<p class="mb-4">Stay tuned to <strong>Todaynews.ng</strong> for updates on upcoming admission cohorts and fee waiver opportunities.</p>
        `,
      },
    ],
  },
  {
    id: "art-2",
    title: "Naira Trades Steady on Official Window as CBN Maintains Active Foreign Exchange Intervention",
    slug: "naira-trades-steady-cbn-fx-intervention",
    summary: "The Nigerian Naira maintained stability against the US Dollar across both official NAFEM and parallel markets as the Central Bank of Nigeria sustained foreign exchange liquidity injections.",
    category: "NAIRA",
    status: "PUBLISHED",
    sourceName: "Central Bank Updates",
    author: "Adekunle Sulaimon",
    imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&auto=format&fit=crop",
    readTimeMinutes: 3,
    views: 18450,
    createdAt: "2026-08-11T09:15:00Z",
    pages: [
      {
        pageNumber: 1,
        title: "Market Overview & Official Window Rates",
        content: `
<p class="mb-4">The Nigerian Naira (NGN) demonstrated resilience during early trading on Tuesday, holding firm at <strong>₦1,595/$1</strong> at the official Nigerian Autonomous Foreign Exchange Market (NAFEM) window.</p>

<p class="mb-4">In the street parallel market across Lagos, Abuja, and Kano, Bureau De Change (BDC) operators quoted buy rates between ₦1,605 and sell rates at ₦1,615 per dollar, reflecting balanced supply and demand dynamics.</p>

<p class="mb-4">Market analysts attribute the relative calm to consistent liquidity sales by the Central Bank of Nigeria (CBN) to authorized dealer banks and foreign exchange bureaus.</p>
        `,
      },
      {
        pageNumber: 2,
        title: "Analyst Predictions & Importer Guidelines for Q3 2026",
        content: `
<p class="mb-4">Financial experts at Lagos Business School predict that continued diaspora remittance inflows coupled with steady crude oil receipts will keep exchange volatility capped under 2% through the third quarter.</p>

<p class="mb-4">Importers are advised to utilize official banking channels for Form M documentation rather than panic-buying on black-market avenues.</p>

<p class="mb-4">Stay connected to <strong>Todaynews.ng Naira Watch</strong> for live updates every hour.</p>
        `,
      },
    ],
  },
  {
    id: "art-3",
    title: "BBNaija 11: Shock as Two Housemates Facing Eviction Swap Roles in Unexpected Head of House Twist",
    slug: "bbnaija-11-housemates-swap-eviction-twist",
    summary: "Big Brother Nigeria Season 11 delivered high drama on Monday night after the new Head of House exercised veto power to save a close ally from the Sunday eviction chopping block.",
    category: "ENTERTAINMENT",
    status: "PUBLISHED",
    sourceName: "Entertainment Gist",
    author: "Adekunle Sulaimon",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop",
    readTimeMinutes: 3,
    views: 31200,
    createdAt: "2026-08-11T08:00:00Z",
    pages: [
      {
        pageNumber: 1,
        title: "The Nomination Drama & Veto Save",
        content: `
<p class="mb-4">Big Brother Naija Season 11 fans were left gasping after Monday night's intense nomination arena games triggered an unprecedented twist in house dynamics.</p>

<p class="mb-4">Following a grueling 45-minute endurance challenge, the newly crowned Head of House secured immunity and exercised the supreme Veto Badge to save their closest confidant from the eviction shortlist.</p>

<p class="mb-4">Social media erupted across X (formerly Twitter) and Facebook groups within minutes, with trending hashtags dominating Nigerian online discourse.</p>
        `,
      },
      {
        pageNumber: 2,
        title: "Fan Reactions & How to Vote for Your Favourite",
        content: `
<p class="mb-4">Voting portals are now officially open on the MyDStv and MyGOtv apps. Viewers can also register online to cast up to 100 free votes per voting window.</p>

<p class="mb-4">Who do you think will survive the upcoming Sunday live eviction show? Drop your thoughts in the comment section below!</p>
        `,
      },
    ],
  },
  {
    id: "art-4",
    title: "Super Eagles Coach Unveils 25-Man Squad for Crucial World Cup Qualifier Matches",
    slug: "super-eagles-coach-unveils-world-cup-qualifier-squad",
    summary: "The Nigerian Football Federation (NFF) has released the official player list for the upcoming double-header World Cup qualifier fixtures against South Africa and Benin Republic.",
    category: "SPORTS",
    status: "PUBLISHED",
    sourceName: "NFF Media Desk",
    author: "Adekunle Sulaimon",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop",
    readTimeMinutes: 3,
    views: 14500,
    createdAt: "2026-08-10T16:45:00Z",
    pages: [
      {
        pageNumber: 1,
        title: "Squad Breakdown & Key Recalls",
        content: `
<p class="mb-4">The Super Eagles technical crew has called up 25 players featuring in top European leagues for next month's international fixtures.</p>

<p class="mb-4">The roster sees the return of key attacking talismans alongside two standout stars from the Nigerian Premier Football League (NPFL).</p>
        `,
      },
      {
        pageNumber: 2,
        title: "Match Schedule & Venue Details",
        content: `
<p class="mb-4">The first leg takes place at the Godswill Akpabio International Stadium in Uyo, with kickoff scheduled for 5:00 PM local time.</p>

<p class="mb-4">Catch all live match analysis and real-time score updates right here on <strong>Todaynews.ng Sports</strong>.</p>
        `,
      },
    ],
  },
  {
    id: "art-5",
    title: "Security Agencies Neutralize Insecurity Syndicate in Joint Operation Across Kaduna Highway",
    slug: "security-agencies-joint-operation-kaduna-highway",
    summary: "A joint tactical squad comprising military and police personnel has cleared illegal checkpoints and rescued abducted travelers along the strategic Kaduna-Abuja expressway.",
    category: "SECURITY",
    status: "PUBLISHED",
    sourceName: "Defense Headquarters",
    author: "Adekunle Sulaimon",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
    readTimeMinutes: 3,
    views: 19800,
    createdAt: "2026-08-10T12:20:00Z",
    pages: [
      {
        pageNumber: 1,
        title: "Operation Details & Rescue Mission",
        content: `
<p class="mb-4">Security personnel executed a swift tactical operation early Tuesday morning, dismantling illicit hideouts along the forest corridors of the Abuja-Kaduna highway.</p>

<p class="mb-4">Seven abducted citizens were safely rescued and reunited with their families after medical evaluation.</p>
        `,
      },
      {
        pageNumber: 2,
        title: "Safety Advisories for Highway Travelers",
        content: `
<p class="mb-4">Commuters are urged to report suspicious movements along interstate highways using the official toll-free emergency response numbers.</p>
        `,
      },
    ],
  },
];
