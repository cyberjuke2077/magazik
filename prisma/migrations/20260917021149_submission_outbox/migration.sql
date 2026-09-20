-- CreateTable
CREATE TABLE "SubmissionReceipt" (
    "key" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionReceipt_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "NotificationJob" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lockToken" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationJob_status_nextAttempt_idx" ON "NotificationJob"("status", "nextAttempt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationJob_kind_requestId_key" ON "NotificationJob"("kind", "requestId");

ALTER TABLE "SubmissionReceipt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationJob" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "electromagaz_app_select" ON "SubmissionReceipt"
  FOR SELECT USING (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_insert" ON "SubmissionReceipt"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_select" ON "NotificationJob"
  FOR SELECT USING (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_insert" ON "NotificationJob"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_update" ON "NotificationJob"
  FOR UPDATE USING (current_user = 'electromagaz_app') WITH CHECK (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_update" ON "WholesaleLead"
  FOR UPDATE USING (current_user = 'electromagaz_app') WITH CHECK (current_user = 'electromagaz_app');
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'electromagaz_app') THEN
    GRANT SELECT, INSERT ON "SubmissionReceipt" TO electromagaz_app;
    GRANT SELECT, INSERT, UPDATE ON "NotificationJob" TO electromagaz_app;
    GRANT UPDATE ON "WholesaleLead" TO electromagaz_app;
  END IF;
END $$;
