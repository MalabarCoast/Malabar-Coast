import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {NextRequest} from "next/server";
import proxy from "../proxy";

test("public pages own their canonicals and the sitemap excludes redirect-only routes", async () => {
  const [layout, home, menu, faq, booking, calicut, sitemap, site, queries] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/menu/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/faq/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/book-a-table/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/story/calicut/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/site.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/queries.ts", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical:/);
  assert.match(site, /https:\/\/www\.malabarcoast\.co\.uk/);
  assert.match(home, /canonical:\s*"\/"/);
  assert.match(menu, /canonical:\s*"\/menu"/);
  assert.match(faq, /canonical:\s*"\/faq"/);
  assert.match(booking, /canonical:\s*"\/book-a-table"/);
  assert.match(calicut, /canonical:\s*"\/story\/calicut"/);
  assert.doesNotMatch(sitemap, /absoluteUrl\("\/special-days"\)/);
  assert.match(sitemap, /getLiveSpecialDayCampaigns/);
  assert.match(queries, /seo\.noIndex != true/);
});

test("obsolete WordPress and WooCommerce requests return 410 Gone", () => {
  const wordpress = proxy(new NextRequest("https://www.malabarcoast.co.uk/wp-includes/js/wp-emoji-release.min.js?ver=7.1"));
  const wooCommerce = proxy(new NextRequest("https://www.malabarcoast.co.uk/?wc-ajax=%25%25endpoint%25%25"));

  for (const response of [wordpress, wooCommerce]) {
    assert.equal(response.status, 410);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  }
});
