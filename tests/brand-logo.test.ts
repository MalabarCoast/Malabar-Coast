import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("the public site uses the approved Malabar logo everywhere", async () => {
  const [layout, home, header, footer, campaign, settings] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/home-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/site-header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/site-footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/christmas-booking/christmas-booking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/site.ts", import.meta.url), "utf8"),
  ]);

  for (const source of [layout, home, header, footer, campaign, settings]) {
    assert.match(source, /\/malabar\.png/);
    assert.doesNotMatch(source, /malabar af|logo-white/);
  }
  assert.match(layout, /logo: absoluteUrl\("\/malabar\.png"\)/);
});

test("favicon and install icons use square PNGs derived from the approved logo", async () => {
  const [layout, manifest, adminLayout, adminManifest, notification, small, large, maskable] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/manifest.webmanifest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/components/admin-activity-notifications.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/icon-192.png", import.meta.url)),
    readFile(new URL("../public/icon-512.png", import.meta.url)),
    readFile(new URL("../public/icon-maskable-512.png", import.meta.url)),
  ]);

  for (const source of [layout, manifest, adminLayout, adminManifest, notification]) {
    assert.match(source, /\/icon-(?:192|512|maskable-512)\.png/);
    assert.doesNotMatch(source, /icon\.svg|malabar af/);
  }
  for (const [image, size] of [[small, 192], [large, 512], [maskable, 512]] as const) {
    assert.equal(image.readUInt32BE(16), size);
    assert.equal(image.readUInt32BE(20), size);
  }
});
