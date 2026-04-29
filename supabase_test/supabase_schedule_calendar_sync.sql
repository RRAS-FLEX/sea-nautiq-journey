-- Schedule the iCal sync Edge Function with pg_cron + pg_net.
--
-- Before running this, create two Vault secrets in Supabase:
--   select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
--   select vault.create_secret('YOUR_CALENDAR_SYNC_SECRET', 'calendar_sync_secret');
--
-- Then run this SQL once in the Supabase SQL editor.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'sync-boat-calendars-hourly',
  '0 * * * *',
  $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/sync-boat-calendars',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'calendar_sync_secret')
      ),
      body := jsonb_build_object(
        'source', 'pg_cron'
      )
    );
  $$
);
