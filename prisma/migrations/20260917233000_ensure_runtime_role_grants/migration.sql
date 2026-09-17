-- Keep a restored or newly provisioned database closed by default while making
-- the runtime privilege contract deterministic. Credentials are provisioned
-- separately by changing this NOLOGIN role to LOGIN with a secret password.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'electromagaz_app') THEN
    CREATE ROLE electromagaz_app
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;
END
$$;

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
  "SubmissionRateLimit",
  "SubmissionReceipt",
  "NotificationJob",
  "AdminSession"
TO electromagaz_app;

GRANT UPDATE ON TABLE
  "Product",
  "QuoteRequest",
  "WholesaleLead",
  "SubmissionRateLimit",
  "NotificationJob"
TO electromagaz_app;
GRANT INSERT ON TABLE
  "QuoteRequest",
  "QuoteRequestItem",
  "WholesaleLead",
  "SubmissionRateLimit",
  "SubmissionReceipt",
  "NotificationJob",
  "AdminSession"
TO electromagaz_app;
GRANT DELETE ON TABLE "SubmissionRateLimit", "AdminSession" TO electromagaz_app;
