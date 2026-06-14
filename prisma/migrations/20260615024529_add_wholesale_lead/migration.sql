-- CreateTable
CREATE TABLE "WholesaleLead" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "consentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WholesaleLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WholesaleLead_status_idx" ON "WholesaleLead"("status");

-- CreateIndex
CREATE INDEX "WholesaleLead_createdAt_idx" ON "WholesaleLead"("createdAt");

-- CreateIndex
CREATE INDEX "WholesaleLead_email_idx" ON "WholesaleLead"("email");
