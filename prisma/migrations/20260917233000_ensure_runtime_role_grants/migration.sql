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

-- Preserve an existing LOGIN/password, but remove every capability that could
-- bypass the table grants or RLS contract.
ALTER ROLE electromagaz_app
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles runtime_role ON runtime_role.oid = membership.member
    WHERE runtime_role.rolname = 'electromagaz_app'
  ) THEN
    RAISE EXCEPTION 'electromagaz_app must not inherit or SET ROLE into another role';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class object
    JOIN pg_namespace namespace ON namespace.oid = object.relnamespace
    JOIN pg_roles owner ON owner.oid = object.relowner
    WHERE namespace.nspname = 'public'
      AND owner.rolname = 'electromagaz_app'
  ) OR EXISTS (
    SELECT 1
    FROM pg_namespace namespace
    JOIN pg_roles owner ON owner.oid = namespace.nspowner
    WHERE namespace.nspname = 'public'
      AND owner.rolname = 'electromagaz_app'
  ) THEN
    RAISE EXCEPTION 'electromagaz_app must not own objects in schema public';
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
