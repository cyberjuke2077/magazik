-- CreateTable
CREATE TABLE "ImportProgress" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentCategoryId" TEXT,
    "currentCategorySlug" TEXT,
    "currentCategoryName" TEXT,
    "totalCategories" INTEGER NOT NULL DEFAULT 0,
    "processedCategories" INTEGER NOT NULL DEFAULT 0,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "importedProducts" INTEGER NOT NULL DEFAULT 0,
    "updatedProducts" INTEGER NOT NULL DEFAULT 0,
    "failedProducts" INTEGER NOT NULL DEFAULT 0,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "estimatedTimeRemaining" INTEGER,
    "importSpeed" DECIMAL(10,2),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportProgress_status_idx" ON "ImportProgress"("status");
CREATE INDEX "ImportProgress_createdAt_idx" ON "ImportProgress"("createdAt");
