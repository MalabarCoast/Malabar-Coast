# PWA and staff alert operation

The public website and private operations portal are separate installable apps.
Open `/admin/orders` and use the browser's install menu for Operations. On iPhone
and iPad, use Share → Add to Home Screen and open the installed app before enabling
background notifications. The public app never subscribes to private staff alerts.

## Deployment order

1. Apply `supabase/migrations/20261026_admin_alerts_push.sql` in a transaction before
   deploying this release. The same migration is included in `supabase/schema.sql`
   for fresh databases. It creates private RLS tables, transactional triggers,
   audited acknowledgements, device subscriptions and leased push deliveries.
2. Run `npm run push:keys` once locally. It writes VAPID keys and a scheduler token
   to ignored `.env.local`, without printing secrets. Copy `WEB_PUSH_PUBLIC_KEY`,
   `WEB_PUSH_PRIVATE_KEY`, `WEB_PUSH_SUBJECT` and `CRON_SECRET` securely into deployment
   environment settings. Preserve these keys across releases. The private key must
   never have a `NEXT_PUBLIC_` prefix. Use a real contact mailto for the subject.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin and redeploy. Installed apps,
   cookies, permissions and push subscriptions belong to their exact origin; choose
   the canonical domain rather than installing a temporary preview.
4. Configure retries using **Supabase Cron**, independently of the Vercel plan.
   `vercel.json` deliberately defines no cron jobs, so it can deploy on Vercel Hobby.
   Enable Supabase Cron (`pg_cron`), `pg_net` and Vault in the Supabase dashboard.
   In Vault, create `admin_push_url` containing the final HTTPS URL ending in
   `/api/cron/admin-push`, and `admin_push_cron_secret` containing the same generated
   `CRON_SECRET` configured in Vercel. Run `supabase/setup-admin-push-cron.sql` in
   SQL Editor. It replaces only `malabar-admin-push-retry` and schedules it every
   minute. The job reads its bearer token from Vault; never put it in a URL or
   commit it to source control. Verify both Cron runs and `net._http_response`
   HTTP status codes: a successful Cron run only proves the HTTP request was queued.
   Another trusted scheduler can call the same authenticated GET instead.
5. Verify protected `/api/health/ready` details and `/admin/settings`: staff alert
   database, matching VAPID keys and scheduler credentials must be ready. A configured
   token does not prove scheduled executions; inspect those independently in Supabase.
   New events attempt delivery immediately after their request, without waiting for
   Cron. Scheduled retries are still required for failed or interrupted delivery
   when all staff apps are closed; a daily job is not an adequate replacement.
6. On every service device, sign in, press **Enable sound & test**, set speaker volume,
   enable background alerts and grant the OS permission. Press **Test background
   notification** and verify it appears on that device. This sends only to a device
   subscription owned by the current staff session. Optionally keep the service
   screen awake. A fresh page can require another tap to unlock browser audio.

## Delivery and recovery

- A paid order transition, new confirmed table reservation or new hall enquiry queues
  an alert in the same database transaction as the record. Failed/rolled-back records
  cannot create phantom alerts. Provider retries cannot create a second alert.
- The browser fetches the authenticated, role-filtered pending feed every five seconds,
  on focus/reconnection, and when Realtime/Push signals arrive. Realtime payloads never
  establish payment state or supply customer information to the alert UI.
- While audio is unlocked, pending work rings approximately every twelve seconds.
  Other tabs on the same origin coordinate playback using Web Locks and a timestamp.
  An unavailable WAV falls back to a locally generated bell. Device speaker volume,
  silent modes, browser restrictions and Focus/Do Not Disturb still apply.
- **Acknowledge** is a shared staff action recorded in the audit log. It stops the
  pending alarm across devices on the next successful feed check. Viewer accounts
  cannot acknowledge; kitchen accounts can acknowledge order alerts only. Reviewing
  an alert alone does not acknowledge it. Refunded/completed/deleted orders, past
  reservations and hall requests no longer marked new leave the pending feed.
- Background push contains generic staff-alert text, never customer contact details,
  order contents, values or addresses. It uses OS notification sound/vibration, not
  the foreground WAV. Notification click opens protected Operations.
- Delivery is attempted after a request completes and retried by the scheduler. Each
  device delivery has an exclusive two-minute lease, a unique lease token, exponential
  backoff, at most eight claims, and a 24-hour dispatch horizon. Successful sends are
  not resent; endpoint responses 404/410 remove the subscription. A push-service
  acceptance is not proof that a person heard or saw it. Pending alerts remain in
  the database until acknowledged or no longer actionable.
- Device notification authorization lasts at most 30 days and is renewed when a
  signed-in app reconnects. It is separate from the eight-hour UI login: generic
  notifications can still arrive after UI sign-in expires, but opening records and
  acknowledging work requires a fresh valid login. Deactivation and session-version
  revocation stop future dispatch. Sign-out first revokes subscriptions belonging to that session;
  if revocation storage fails it reports an error rather than claiming success.
- Previously delivered notifications cannot be recalled after sign-out, so their
  contents stay generic. Account role and activation are rechecked before dispatch.

## Device acceptance checks

Use test-mode checkout and dedicated test data. Never test local checkout with live
payment credentials. Test each actual staff device; desktop emulation does not prove
iOS/Android background delivery or physical speaker audibility.

1. Install public and Operations apps separately; confirm their names and launch URLs.
2. Test chime, then create a test paid order. Confirm visible alert and repeated sound.
3. Acknowledge on a second device; confirm the first stops within the next feed check.
4. Disconnect a device, create an order, reconnect, and confirm it catches up.
5. Open multiple tabs; confirm their bells do not layer on the same origin.
6. Allow notifications, put Operations in the background and lock the phone. Confirm
   an OS notification arrives; test separately with Focus/silent settings enabled.
7. Close the app and test push. Force-stopped apps and OS restrictions can still block
   delivery. Keep an awake counter screen as the primary service alarm.
8. Revoke staff access/session version and confirm subsequent pushes stop. Verify an
   expired login shows the sign-in warning and cannot fetch/acknowledge private work,
   while an opted-in active device can still receive generic background notifications.
9. Simulate a push failure and a crashed dispatcher; confirm retry/backoff/lease recovery
   from scheduler logs. Confirm unsigned scheduler requests return 401.

No PWA can guarantee an audible custom sound on a muted, powered-off, sleeping or
OS-suspended device. Use an awake counter terminal and an operational fallback when
missing an order would be unacceptable.
