-- Production runtime role uses direct Postgres access through Supavisor.
-- RLS remains enabled: only the dedicated server role receives application access.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'electromagaz_app') THEN
    REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM electromagaz_app;

    GRANT SELECT ON TABLE
      "Category",
      "Manufacturer",
      "Product",
      "ProductImage",
      "Specification",
      "Datasheet",
      "ProductAnalog",
      "QuoteRequest",
      "QuoteRequestItem",
      "WholesaleLead",
      "SubmissionRateLimit"
    TO electromagaz_app;

    GRANT UPDATE ON TABLE "Product" TO electromagaz_app;
    GRANT INSERT, UPDATE ON TABLE "QuoteRequest" TO electromagaz_app;
    GRANT INSERT ON TABLE "QuoteRequestItem" TO electromagaz_app;
    GRANT INSERT ON TABLE "WholesaleLead" TO electromagaz_app;
    GRANT INSERT, UPDATE, DELETE ON TABLE "SubmissionRateLimit" TO electromagaz_app;
  END IF;
END
$$;

ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Manufacturer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Specification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Datasheet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductAnalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuoteRequestItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WholesaleLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmissionRateLimit" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "electromagaz_app_select" ON "Category";
CREATE POLICY "electromagaz_app_select" ON "Category"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "Manufacturer";
CREATE POLICY "electromagaz_app_select" ON "Manufacturer"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "Product";
CREATE POLICY "electromagaz_app_select" ON "Product"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_update" ON "Product";
CREATE POLICY "electromagaz_app_update" ON "Product"
  FOR UPDATE
  USING (current_user = 'electromagaz_app')
  WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "ProductImage";
CREATE POLICY "electromagaz_app_select" ON "ProductImage"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "Specification";
CREATE POLICY "electromagaz_app_select" ON "Specification"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "Datasheet";
CREATE POLICY "electromagaz_app_select" ON "Datasheet"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "ProductAnalog";
CREATE POLICY "electromagaz_app_select" ON "ProductAnalog"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "QuoteRequest";
CREATE POLICY "electromagaz_app_select" ON "QuoteRequest"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_insert" ON "QuoteRequest";
CREATE POLICY "electromagaz_app_insert" ON "QuoteRequest"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_update" ON "QuoteRequest";
CREATE POLICY "electromagaz_app_update" ON "QuoteRequest"
  FOR UPDATE
  USING (current_user = 'electromagaz_app')
  WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "QuoteRequestItem";
CREATE POLICY "electromagaz_app_select" ON "QuoteRequestItem"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_insert" ON "QuoteRequestItem";
CREATE POLICY "electromagaz_app_insert" ON "QuoteRequestItem"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "WholesaleLead";
CREATE POLICY "electromagaz_app_select" ON "WholesaleLead"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_insert" ON "WholesaleLead";
CREATE POLICY "electromagaz_app_insert" ON "WholesaleLead"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_select" ON "SubmissionRateLimit";
CREATE POLICY "electromagaz_app_select" ON "SubmissionRateLimit"
  FOR SELECT USING (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_insert" ON "SubmissionRateLimit";
CREATE POLICY "electromagaz_app_insert" ON "SubmissionRateLimit"
  FOR INSERT WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_update" ON "SubmissionRateLimit";
CREATE POLICY "electromagaz_app_update" ON "SubmissionRateLimit"
  FOR UPDATE
  USING (current_user = 'electromagaz_app')
  WITH CHECK (current_user = 'electromagaz_app');

DROP POLICY IF EXISTS "electromagaz_app_delete" ON "SubmissionRateLimit";
CREATE POLICY "electromagaz_app_delete" ON "SubmissionRateLimit"
  FOR DELETE USING (current_user = 'electromagaz_app');
