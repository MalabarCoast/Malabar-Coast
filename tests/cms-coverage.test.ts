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

test("home signature cards, hall action and established date are CMS-owned", async () => {
  const [home, experience, signatures, marketingSchema, sectionSchema, settingsSchema, query] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/home-experience.tsx"),
    read("../app/components/home-signatures.tsx"),
    read("../studio/schemaTypes/documents/marketingPage.ts"),
    read("../studio/schemaTypes/objects/contentSection.ts"),
    read("../studio/schemaTypes/documents/siteSettings.ts"),
    read("../sanity/lib/queries.ts"),
  ]);
  assert.match(marketingSchema, /name: 'heroTertiaryLink'/);
  assert.match(sectionSchema, /name: 'featuredDishes'/);
  assert.match(settingsSchema, /name: 'establishedDate'/);
  assert.match(query, /heroTertiaryLink/);
  assert.match(query, /featuredDishes\[\]/);
  assert.match(query, /establishedDate/);
  assert.match(home, /featuredDishes: menu\?\.featuredDishes/);
  assert.match(home, /establishedDate: siteSettings\.establishedDate/);
  assert.match(experience, /content\.heroTertiaryLink/);
  assert.match(experience, /<div className="heroActions">[\s\S]*?heroTertiaryLink/);
  assert.doesNotMatch(experience, /heroHallLink/);
  assert.match(signatures, /featuredDishes\?\.length/);
});

test("menu interlude images are editable in the menu page CMS", async () => {
  const [experience, schema, query] = await Promise.all([
    read("../app/menu/menu-experience.tsx"),
    read("../studio/schemaTypes/documents/menuPage.ts"),
    read("../sanity/lib/queries.ts"),
  ]);
  assert.match(schema, /name: 'menuInterludes'/);
  assert.match(schema, /name: 'afterCategory'/);
  assert.match(query, /menuInterludes\[\]/);
  assert.match(experience, /page\.menuInterludes/);
  assert.match(experience, /menuInterludes\.get\(category\.slug\)/);
});

test("today's specials inherit catalogue data from selected menu items", async () => {
  const [schema, query, loader, admin, structure] = await Promise.all([
    read("../studio/schemaTypes/documents/dailySpecial.ts"),
    read("../sanity/lib/queries.ts"),
    read("../sanity/lib/daily-specials.ts"),
    read("../app/admin/content/page.tsx"),
    read("../studio/structure.ts"),
  ]);
  assert.match(schema, /name: 'menuItem'[\s\S]*?Choose a dish from the menu catalogue[\s\S]*?rule\.required\(\)/);
  assert.match(schema, /name: 'titleOverride'/);
  assert.match(schema, /name: 'descriptionOverride'/);
  assert.match(schema, /name: 'imageOverride'/);
  assert.match(schema, /name: 'priceOverridePence'/);
  assert.match(query, /menuItem->\{[\s\S]*?name,[\s\S]*?description,[\s\S]*?pricePence,[\s\S]*?image \{/);
  assert.match(loader, /record\.menuItem\?\.name/);
  assert.match(loader, /record\.menuItem\?\.description/);
  assert.match(loader, /record\.menuItem\?\.pricePence/);
  assert.match(loader, /record\.menuItem\?\.image/);
  assert.match(admin, /Choose from menu/);
  assert.match(structure, /Today's specials · choose from menu/);
});

test("the offers page combines menu-linked specials with independently managed promotions", async () => {
  const [offers, image, promotionSchema, structure] = await Promise.all([
    read("../app/offers/page.tsx"),
    read("../app/components/cms-sanity-image.tsx"),
    read("../studio/schemaTypes/documents/promotion.ts"),
    read("../studio/structure.ts"),
  ]);
  assert.match(offers, /getActiveDailySpecials/);
  assert.match(offers, /dailySpecials\.map/);
  assert.match(offers, /getActivePromotions/);
  assert.match(offers, /promotions\.map/);
  assert.match(offers, /CmsSanityImage/);
  assert.match(offers, /Dish names, images, descriptions and standard prices stay in sync with the menu/);
  assert.match(image, /getCmsImageUrl/);
  assert.match(image, /unoptimized/);
  assert.match(promotionSchema, /title: 'Offers page poster'/);
  assert.match(promotionSchema, /main image on the Offers page/);
  assert.match(structure, /Offers & carousel posters/);
});
