-- Optional deployment setup, not an application schema migration.
-- Enable Supabase Cron (pg_cron), pg_net and Vault in the dashboard first.
-- Create these secrets in Supabase Vault, never in this file:
--   admin_push_url: https://YOUR-CANONICAL-DOMAIN/api/cron/admin-push
--   admin_push_cron_secret: the same CRON_SECRET configured in Vercel
-- Re-running replaces only this application's named job. No secrets are printed
-- or embedded in cron.job.command; Vault is read when each job runs.
begin;
do $$
declare target text; token text;
begin
  if to_regnamespace('cron') is null or to_regnamespace('net') is null
    or to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Enable Supabase Cron, pg_net and Vault before scheduling push retries';
  end if;
  if (select count(*) from vault.decrypted_secrets where name='admin_push_url')<>1
    or (select count(*) from vault.decrypted_secrets where name='admin_push_cron_secret')<>1 then
    raise exception 'Create exactly one Vault secret each: admin_push_url and admin_push_cron_secret';
  end if;
  select decrypted_secret into target from vault.decrypted_secrets where name='admin_push_url';
  select decrypted_secret into token from vault.decrypted_secrets where name='admin_push_cron_secret';
  if target !~ '^https://[A-Za-z0-9.-]+/api/cron/admin-push$'
    or char_length(token) not between 32 and 256 or token !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'Use the canonical HTTPS push endpoint and the generated scheduler secret';
  end if;
  perform cron.unschedule(jobid) from cron.job where jobname='malabar-admin-push-retry';
  perform cron.schedule('malabar-admin-push-retry','* * * * *', $job$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name='admin_push_url'),
      headers := jsonb_build_object('Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='admin_push_cron_secret')),
      timeout_milliseconds := 55000
    );
  $job$);
end $$;
commit;
