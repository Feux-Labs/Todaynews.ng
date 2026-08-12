-- CreateEnum
CREATE TYPE "Category" AS ENUM ('POLITICS', 'NAIRA', 'ENTERTAINMENT', 'SPORTS', 'SECURITY', 'METRO', 'EDUCATION', 'TECHNOLOGY', 'HEALTH');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('AI_PENDING', 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'EDITOR', 'REVIEWER');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'EDITOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'AI_PENDING',
    "sourceUrl" TEXT,
    "sourceName" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageCredit" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Todaynews.ng Editorial',
    "readTimeMinutes" INTEGER NOT NULL DEFAULT 3,
    "views" INTEGER NOT NULL DEFAULT 0,
    "approvedById" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "storyCards" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultAuthorName" TEXT NOT NULL,
    "defaultAuthorEmail" TEXT NOT NULL,
    "defaultAuthorBio" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteTagline" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticlePage" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,

    CONSTRAINT "ArticlePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "articleSlug" TEXT NOT NULL,
    "category" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_email_idx" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_active_idx" ON "AdminUser"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_createdAt_idx" ON "Article"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Article_status_scheduledAt_idx" ON "Article"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Article_status_category_createdAt_idx" ON "Article"("status", "category", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Article_status_views_idx" ON "Article"("status", "views" DESC);

-- CreateIndex
CREATE INDEX "Article_category_idx" ON "Article"("category");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "AiChatMessage_createdAt_idx" ON "AiChatMessage"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ArticlePage_articleId_idx" ON "ArticlePage"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticlePage_articleId_pageNumber_key" ON "ArticlePage"("articleId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "PageView_articleSlug_idx" ON "PageView"("articleSlug");

-- CreateIndex
CREATE INDEX "PageView_visitedAt_idx" ON "PageView"("visitedAt" DESC);

-- CreateIndex
CREATE INDEX "PageView_visitedAt_articleSlug_idx" ON "PageView"("visitedAt", "articleSlug");

-- CreateIndex
CREATE INDEX "PageView_category_idx" ON "PageView"("category");

-- AddForeignKey
ALTER TABLE "ArticlePage" ADD CONSTRAINT "ArticlePage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
