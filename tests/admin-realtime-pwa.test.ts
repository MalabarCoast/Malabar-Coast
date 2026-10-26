import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("admin activity alerts verify records before showing or sounding", async () => {
  const [notifier,publisher,reservationRoute,hallRoute] = await Promise.all([
    readFile(new URL("../app/admin/components/admin-activity-notifications.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/publishEvent.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/reservations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/hall-enquiries/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(notifier, /fetch\("\/api\/admin\/alerts"/);
  assert.match(notifier, /if \(!response\.ok \|\| !Array\.isArray\(body\.alerts\)\)/);
  assert.match(notifier, /playOrderNotificationSound\(\)/);
  assert.match(notifier, /armOrderNotificationSound\(\)/);
  assert.match(notifier, /window\.addEventListener\("focus", onFocus\)/);
  assert.match(notifier, /document\.addEventListener\("visibilitychange", onVisibility\)/);
  assert.match(notifier, /Enable sound & test/);
  assert.match(notifier, /setInterval/);
  assert.doesNotMatch(notifier, /new Notification\(/);
  assert.match(publisher, /admin-activity/);
  assert.match(publisher, /activity-changed/);
  assert.match(reservationRoute, /publishAdminActivityEvent\("reservation"/);
  assert.match(hallRoute, /publishAdminActivityEvent\("hall"/);
});

test("admin has a private network-first installable PWA shell", async () => {
  const [layout,manifest,registration,worker] = await Promise.all([
    readFile(new URL("../app/admin/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/manifest.webmanifest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/components/admin-pwa-registration.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/admin-sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /\/admin\/manifest\.webmanifest/);
  assert.match(manifest, /start_url: "\/admin\/orders"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(registration, /\/admin-sw\.js/);
  assert.doesNotMatch(registration, /MutationObserver/);
  assert.match(registration, /scope: "\/admin"/);
  assert.match(worker, /showNotification/);
  assert.doesNotMatch(worker, /caches\.open/);
  assert.match(worker, /Reconnect to securely load live orders/);
});
