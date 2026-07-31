-- CreateTable
CREATE TABLE "SubmissionRateLimit" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "SubmissionRateLimit_expiresAt_idx" ON "SubmissionRateLimit"("expiresAt");
