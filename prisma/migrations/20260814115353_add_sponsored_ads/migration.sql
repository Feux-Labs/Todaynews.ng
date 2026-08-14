-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'SCHOLARSHIP';
ALTER TYPE "Category" ADD VALUE 'JAPA';
ALTER TYPE "Category" ADD VALUE 'MAKE_MONEY_ONLINE';

-- CreateTable
CREATE TABLE "SponsoredAd" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sponsor" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "category" TEXT,
    "badgeText" TEXT NOT NULL DEFAULT 'Sponsored',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsoredAd_active_idx" ON "SponsoredAd"("active");

-- CreateIndex
CREATE INDEX "SponsoredAd_createdAt_idx" ON "SponsoredAd"("createdAt" DESC);
