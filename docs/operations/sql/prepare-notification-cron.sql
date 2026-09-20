-- Prepared only. Target: Supabase dbumwpnbtvixfusxnggn, database postgres.
-- Apply after the three 20260917 migrations and a verified backup.
-- Provision the shared CRON_SECRET in Vercel Production and Supabase Vault
-- (name: electromagaz_notifications_cron) through secure configuration first.
-- This transaction creates a DISABLED job. Enable only after deployment smoke.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $prepare$
DECLARE
  notification_job_id bigint;
BEGIN
  IF to_regclass('public."NotificationJob"') IS NULL THEN
    RAISE EXCEPTION 'NotificationJob migration is required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets
    WHERE name = 'electromagaz_notifications_cron'
      AND length(decrypted_secret) >= 32
  ) THEN
    RAISE EXCEPTION 'Provision the shared notification secret in Vault first';
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'electromagaz-notifications') THEN
    RAISE EXCEPTION 'Notification job already exists; inspect it before changing';
  END IF;

  SELECT cron.schedule('electromagaz-notifications', '* * * * *', $job$
    SELECT net.http_get(
      url := 'https://electromagaz-production.vercel.app/api/cron/notifications',
      headers := jsonb_build_object('Authorization', 'Bearer ' || decrypted_secret),
      timeout_milliseconds := 55000
    )
    FROM vault.decrypted_secrets
    WHERE name = 'electromagaz_notifications_cron'
      AND length(decrypted_secret) >= 32
      AND EXISTS (
        SELECT 1 FROM public."NotificationJob"
        WHERE (status = 'pending' AND "nextAttempt" <= now())
          OR (status = 'sending' AND "lockedUntil" < now())
      );
  $job$) INTO notification_job_id;
  PERFORM cron.alter_job(notification_job_id, active := false);
END
$prepare$;
COMMIT;

-- After deployment and successful authenticated endpoint check:
-- SELECT cron.alter_job(jobid, active := true)
-- FROM cron.job WHERE jobname = 'electromagaz-notifications';
-- Before application rollback, pause with active := false. Preserve the queue.
-- Verify HTTP status in net._http_response, not just cron.job_run_details:
-- a successful SQL tick does not prove HTTP delivery.
