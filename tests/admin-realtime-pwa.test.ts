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
  assert.match(notifier, /await fetch\(endpoints\[payload\.kind\]/);
  assert.match(notifier, /if \(!response\.ok\) return/);
  assert.match(notifier, /playOrderNotificationSound\(\)/);
  assert.match(notifier, /armOrderNotificationSound\(\)/);
  assert.match(notifier, /window\.addEventListener\("focus", arm\)/);
  assert.match(notifier, /document\.addEventListener\("visibilitychange", arm\)/);
  assert.doesNotMatch(notifier, /Enable alert sound/);
  assert.match(notifier, /New paid food order/);
  assert.match(notifier, /New table booking/);
  assert.match(notifier, /New hall enquiry/);
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
  assert.match(manifest, /start_url: "\/admin\/"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(registration, /\/admin-sw\.js/);
  assert.match(registration, /MutationObserver/);
  assert.doesNotMatch(worker, /caches\.open/);
  assert.match(worker, /Reconnect to securely load live orders/);
});
