import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("the supplied Malabar Coast Google Map is CMS-managed and safely embedded", async () => {
  const [site, settings, query, schema, home] = await Promise.all([
    readFile(new URL("../app/lib/site.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/site.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/queries.ts", import.meta.url), "utf8"),
    readFile(new URL("../studio/schemaTypes/documents/siteSettings.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/home-experience.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(site, /0x48886d005a9bd0b5%3A0x9fbf2c81d7d0d5e8/);
  assert.match(settings, /sanitiseGoogleMapsEmbedUrl/);
  assert.match(query, /mapEmbedUrl/);
  assert.match(schema, /Embedded Google Map URL/);
  assert.match(home, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(home, /loading="lazy"/);
});

test("mobile controls retain thumb-sized targets and safe viewport behaviour", async () => {
  const [globalCss, menuCss, adminCss, worker] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/menu/menu.css", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"),
    readFile(new URL("../public/admin-sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(globalCss, /promotionPopupNav > div button \{[\s\S]*?width: 2\.75rem;[\s\S]*?height: 2\.75rem/);
  assert.match(menuCss, /menuSearch button \{[\s\S]*?min-height: 2\.75rem/);
  assert.match(adminCss, /adminRecordGrid textarea[\s\S]*?font-size: 1rem/);
  assert.match(adminCss, /max-height: calc\(100dvh - 1rem\)/);
  assert.match(adminCss, /adminOrdersTable th:last-child/);
  assert.match(worker, /viewport-fit=cover/);
  assert.match(worker, /min-height:44px/);
});

test("the careers empty state cannot collide with its editorial heading", async () => {
  const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(globalCss, /\.careersBody \{ padding:clamp\(1\.75rem,4vw,3rem\)/);
  assert.match(globalCss, /\.careersIntro \{ margin-bottom:1\.25rem;/);
  assert.match(globalCss, /\.careersEmpty \{ padding:2rem;/);
  assert.match(globalCss, /\.careersEmpty h3 \{ margin:0 0 \.75rem;/);
  assert.doesNotMatch(globalCss, /\.careersEmpty \{[^}]*position:absolute/);
});
