# Todaynews.ng — Project Configuration & Continuity Document

Read this document to understand the architecture, setup instructions, and deployment details of **Todaynews.ng**.

---

## 🚀 Getting Started

Follow these steps to configure your local playground or production environment:

### 1. Install Dependencies
Run npm installation locally to populate `node_modules`:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
- **`DATABASE_URL`**: Your serverless Postgres connection string (e.g. from Neon.tech).
- **`GEMINI_API_KEY`**: Your Google Gemini API Studio key for AI paraphrasing. If empty, the system automatically uses a smart simulated rewriter.
- **`NEXT_PUBLIC_SITE_URL`**: The live URL (e.g. `https://todaynews.ng`) used for SEO schemas and sitemap generation.

### 3. Database Initialization
If you have configured `DATABASE_URL` with a live Neon DB, run the Prisma migration to sync schemas:
```bash
npx prisma db push
```

If you don't configure database details, the project falls back to a built-in **In-Memory Mock Database** (`src/lib/db.ts`) with authentic Nigerian news articles, Naira rate watch tickers, and native sponsored ads so the entire application works out of the box!

### 4. Running the Development Server
Run the local dev command:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the platform.

---

## 📈 Monetization & Adsterra Architecture

Todaynews.ng is custom-coded with advanced publisher widgets mimicking Taboola, Outbrain, and RankMath:

1. **Multi-page Listicles**: Articles are broken down across separate URLs (`?page=1`, `?page=2`, etc.) to multiply pageviews and ad impressions per visitor.
2. **In-Article Ad Placements**: Banners and native widgets are automatically injected after paragraphs 2 & 6 without disrupting reader readability.
3. **Around the Web (Sponsored Feed)**: Native offer grids are populated beneath the article (styled to look like natural headlines but redirecting to high-CPM offers).
4. **Adsterra Script Containers**: Placeholders for Banner, Native, Social Bar, and Popunder scripts are integrated into layout containers.
   - To activate live Adsterra scripts, set `NEXT_PUBLIC_LIVE_ADS=true` in your `.env` and paste your actual script publisher code inside the [src/components/AdSlot.tsx](file:///c:/Users/user/Desktop/Todaynews/src/components/AdSlot.tsx) component.

---

## 🔍 Core SEO Engine

The platform implements SEO practices for Google News and search visibility:
- **JSON-LD Schema Markup**: Dynamic `NewsArticle` schemas, `BreadcrumbList` schemas, and `Organization` schemas injected directly into the HTML head.
- **Dynamic Metadata**: Customized dynamic titles, meta descriptions, and OpenGraph/Twitter Cards compiled per article and category.
- **Canonical Pagination**: Inpaginated pages (`?page=2`) output `rel="next"`, `rel="prev"`, and canonical URL headers to prevent duplicate content flags.
- **XML Sitemap**: Auto-generated dynamic sitemap at `/sitemap.xml` listing categories and individual article routes.
- **Robots Index**: Dynamic `/robots.txt` configuration indexing all valuable pages while blocking search engine crawl loops on admin/search paths.

---

## 🛠 Editorial Review Workflow

The team maintains control over the automated ingestion pipeline:
1. **Ingest**: Pasting a source article in the **Editor Portal** (`/admin`) triggers the Gemini AI engine.
2. **Paraphrase**: The AI rewrites the news in a high-CTR, punchy Nigerian style and splits it into pages.
3. **Draft Queue**: The article is saved with status `PENDING`. It is NOT visible to public visitors.
4. **Review**: The editor can click **Review**, preview the layout, edit page titles, or modify content.
5. **Publish**: Clicking **Publish** makes the story live instantly.

---

## 📦 Deployment to Vercel

1. Push this codebase to a private GitHub Repository.
2. Link your Vercel Account to the repository.
3. Add your Environment variables (`DATABASE_URL`, `GEMINI_API_KEY`, etc.) in the Vercel project settings.
4. Deploy! Vercel handles serverless function routing and Next.js App Router optimizations automatically.
