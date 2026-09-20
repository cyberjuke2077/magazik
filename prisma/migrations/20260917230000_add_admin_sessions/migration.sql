-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

ALTER TABLE "AdminSession" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "electromagaz_app_select" ON "AdminSession"
  FOR SELECT USING (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_insert" ON "AdminSession"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');
CREATE POLICY "electromagaz_app_delete" ON "AdminSession"
  FOR DELETE USING (current_user = 'electromagaz_app');

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'electromagaz_app') THEN
    GRANT SELECT, INSERT, DELETE ON "AdminSession" TO electromagaz_app;
  END IF;
END $$;
