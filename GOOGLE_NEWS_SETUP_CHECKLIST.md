# 🚀 GOOGLE NEWS, DISCOVER & SEARCH RANKING SETUP CHECKLIST
**Site:** Todaynews.ng  
**Target:** Google News, Google Discover, and Top Rankings for "today news" / "naija news today"

---

## 🟢 COMPLETED IN CODEBASE (Ready & Fully Functional)

- [x] **Trust Pages Created**:
  - [x] About Us Page (`/about`) with `NewsMediaOrganization` JSON-LD schema.
  - [x] Editorial Standards & Corrections Policy (`/editorial-standards`).
  - [x] Chief Editor Byline Page (`/author/gideon-ibitoye`) with `Person` JSON-LD schema & verified editor badge.
  - [x] Contact Page (`/contact`) with newsroom form, bureau addresses, and department emails.
- [x] **Structured Data & JSON-LD**:
  - [x] Added `NewsArticle` schema with `isAccessibleForFree: true`, `inLanguage: "en-NG"`, `author`, `publisher` logo, `datePublished`, and `dateModified`.
  - [x] Added `NewsMediaOrganization` schema to homepage & About page.
  - [x] Unique clean URLs, single `<h1>` title, and `<title>` + meta description per article.
- [x] **Sitemaps**:
  - [x] Regular XML Sitemap (`/sitemap.xml`) generated for all static trust pages, category indexes, and article paths.
  - [x] **Google News 48-Hour XML Sitemap** (`/sitemap-news.xml`) created following official Google News `<news:news>` schema specs.
- [x] **Google News Content Quality Filter (AI Rewriter)**:
  - [x] Prompt enhanced to inject **"Why This Matters to Nigerians"**, **"Background & Context"**, and **"What Happens Next"** analysis.
  - [x] Legal protection hedging words enforced (*"allegedly"*, *"according to reports"*, *"subject to official verification"*).
- [x] **Internal Linking & Page Speed**:
  - [x] `MidArticleRelatedNews` component links every article to 3 related articles with visible date stamps.
  - [x] Site-wide mobile-first response & fast ISR revalidation.

---

## 📋 YOUR MANUAL ACTION CHECKLIST (Tick These Off As You Complete Them)

### Phase 1: Social Profiles (5 Mins)
- [ ] **Create/Link Official Social Handles**:
  - [ ] Facebook Page: `https://facebook.com/todaynewsng`
  - [ ] Twitter / X: `@todaynews_ng`
  - [ ] Instagram: `@todaynewsng`
  - [ ] WhatsApp Channel / Group for breaking alerts

---

### Phase 2: Google Search Console Setup (10 Mins)
- [ ] **Go to Google Search Console**: Visit [search.google.com/search-console](https://search.google.com/search-console).
- [ ] **Add Property**: Select **Domain** property type and enter `todaynews.ng`.
- [ ] **Verify Ownership**:
  - Option A: Add the DNS `TXT` record provided by Google to your domain registrar (Namecheap, Whogohost, Cloudflare, etc.).
  - Option B: Download the Google HTML verification file and place it inside `c:\Users\user\Desktop\Todaynews\public\` folder.
- [ ] **Verify & Leave Open**: Click **Verify** in Search Console.

---

### Phase 3: Submit Sitemaps in Search Console (3 Mins)
- [ ] In Search Console left sidebar, go to **Indexing → Sitemaps**.
- [ ] Submit Main XML Sitemap: Enter `sitemap.xml` and click **Submit**.
- [ ] Submit Google News Sitemap: Enter `sitemap-news.xml` and click **Submit**.
- [ ] Confirm both show status **"Success"**.

---

### Phase 4: Google Publisher Center Setup (15 Mins)
- [ ] **Go to Publisher Center**: Visit [publishercenter.google.com](https://publishercenter.google.com).
- [ ] **Sign In**: Log in using the exact same Google account as Search Console.
- [ ] **Click "Add Publication"**:
  - Publication Name: `Todaynews.ng`
  - Primary Language: `English`
  - Location: `Nigeria`
- [ ] **Add Branding**:
  - Upload square logo (512x512 PNG).
  - Upload transparent rectangular logo for light/dark themes.
- [ ] **Add Content Sections**:
  - Section 1: Politics (`https://todaynews.ng/category/politics`)
  - Section 2: Naira Watch (`https://todaynews.ng/category/naira`)
  - Section 3: Entertainment (`https://todaynews.ng/category/entertainment`)
  - Section 4: Sports (`https://todaynews.ng/category/sports`)
  - Section 5: Security (`https://todaynews.ng/category/security`)
- [ ] **Set Editorial Info**:
  - Contact Email: `editor@todaynews.ng`
  - Terms / Editorial Standards Link: `https://todaynews.ng/editorial-standards`
- [ ] **Submit Publication**: Click **Publish** for review.

---

### Phase 5: Rich Results Test Verification (5 Mins)
- [ ] **Test Article Template**: Visit [search.google.com/test/rich-results](https://search.google.com/test/rich-results).
- [ ] Paste a live article URL (e.g. `https://todaynews.ng/article/sample-headline`).
- [ ] Confirm green checkmarks for **NewsArticle**, **Breadcrumbs**, and **Valid Structured Data**.

---

### Phase 6: Continuous Publishing & Monitoring Strategy
- [ ] **Consistent Volume**: Run automated 30-min scraper / publish daily (at least 5–15 quality human-reviewed stories per day).
- [ ] **Weekly Indexing Check**: Check Search Console → Indexing → Pages weekly to observe crawl stats.
- [ ] **Discover & News Tab Monitoring**: Check Search Console → Performance → "News" & "Discover" tabs (populates in 4-8 weeks).

---

### 🎯 Pro-Tip for Target Keywords ("today news" / "naija news today")
- Include target location + "today" + date in breaking headlines (e.g., *"Naira Exchange Rate Today, August 11 2026"*).
- Rely on your 48-hour Google News sitemap (`/sitemap-news.xml`) for fast indexing within minutes of publishing!
