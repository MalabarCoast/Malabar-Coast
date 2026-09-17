import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("guest-facing editorial routes read their page shell and SEO from Sanity", async () => {
  const routes = [
    ["../app/page.tsx", "home"],
    ["../app/story/page.tsx", "story"],
    ["../app/story/calicut/page.tsx", "story-calicut"],
    ["../app/restaurant/page.tsx", "restaurant"],
    ["../app/hall/page.tsx", "hall"],
    ["../app/offers/page.tsx", "offers"],
    ["../app/faq/page.tsx", "faq"],
    ["../app/book-a-table/page.tsx", "book-a-table"],
  ] as const;

  for (const [path, pageKey] of routes) {
    const source = await read(path);
    assert.match(source, new RegExp(`getMarketingPage\\(\\"${pageKey}\\"\\)`), `${path} must render Sanity content`);
    assert.match(source, new RegExp(`getMarketingPageMetadata\\(\\"${pageKey}\\"`), `${path} must use Sanity SEO`);
  }
});

test("every public policy can be edited as structured CMS sections", async () => {
  const [component, schema, query] = await Promise.all([
    read("../app/components/legal-page.tsx"),
    read("../studio/schemaTypes/documents/legalPage.ts"),
    read("../sanity/lib/queries.ts"),
  ]);
  assert.match(component, /getLegalPage\(pageKey\)/);
  assert.match(component, /PortableContent/);
  for (const pageKey of ["payments", "privacy", "returns", "cookie"]) {
    assert.match(schema, new RegExp(`value: '${pageKey}'`));
    const page = await read(`../app/${pageKey}/page.tsx`);
    assert.match(page, new RegExp(`ManagedLegalPage pageKey=\\"${pageKey}\\"`));
    assert.match(page, new RegExp(`getLegalPageMetadata\\(\\"${pageKey}\\"`));
  }
  assert.match(schema, /name: 'sections'/);
  assert.match(query, /legalPageQuery[\s\S]*sections\[\]/);
});

test("global identity, navigation, footer and default SEO come from site settings", async () => {
  const [layout, header, footer, schema, query] = await Promise.all([
    read("../app/layout.tsx"),
    read("../app/components/site-header.tsx"),
    read("../app/components/site-footer.tsx"),
    read("../studio/schemaTypes/documents/siteSettings.ts"),
    read("../sanity/lib/queries.ts"),
  ]);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /globalSchema\(siteSettings,\s*schedule\)/);
  assert.match(header, /settings\.primaryNavigation/);
  assert.match(footer, /settings\.footerHeading/);
  assert.match(schema, /footerCreditUrl/);
  assert.match(query, /defaultSeo[\s\S]*asset->url/);
});

test("private hall features, assurances, FAQs and closing copy are CMS-owned", async () => {
  const hall = await read("../app/hall/page.tsx");
  assert.match(hall, /getFaqItems\(\)/);
  assert.match(hall, /introductionSection\?\.items/);
  assert.match(hall, /enquirySection\?\.items/);
  assert.match(hall, /getPageSection\(cmsPage, "hall-faq"\)/);
  assert.match(hall, /getPageSection\(cmsPage, "hall-closing"\)/);
});
