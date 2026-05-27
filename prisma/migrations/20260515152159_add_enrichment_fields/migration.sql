-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nameNeedsReview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "enrichmentMeta" JSONB,
ADD COLUMN     "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "lastEnrichedAt" TIMESTAMP(3),
ADD COLUMN     "lifecycle" TEXT,
ADD COLUMN     "mpnNormalized" TEXT,
ADD COLUMN     "package" TEXT;

-- CreateTable
CREATE TABLE "EnrichmentJournal" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "canonicalBrand" TEXT NOT NULL,
    "canonicalMpn" TEXT NOT NULL,
    "originalMpn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "mouserDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentJournal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrichmentJournal_runId_status_idx" ON "EnrichmentJournal"("runId", "status");

-- CreateIndex
CREATE INDEX "EnrichmentJournal_canonicalMpn_idx" ON "EnrichmentJournal"("canonicalMpn");

-- CreateIndex
CREATE INDEX "EnrichmentJournal_status_idx" ON "EnrichmentJournal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentJournal_runId_canonicalBrand_canonicalMpn_key" ON "EnrichmentJournal"("runId", "canonicalBrand", "canonicalMpn");

-- CreateIndex
CREATE UNIQUE INDEX "Product_manufacturerId_mpnNormalized_key" ON "Product"("manufacturerId", "mpnNormalized");
