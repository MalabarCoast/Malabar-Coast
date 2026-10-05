import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

test("the reusable special-day booking page uses the live reservation service", async () => {
  const [legacyPage, page, experience, standardBooking, sitemap, cms] = await Promise.all([
    readFile(new URL("../app/christmas-booking/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/special-days/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/christmas-booking/christmas-booking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/book-a-table/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../sanity/lib/special-days.ts", import.meta.url), "utf8"),
  ]);

  assert.match(legacyPage, /redirect\("\/special-days\/christmas"\)/);
  assert.match(page, /getBookingSettings/);
  assert.match(page, /getRestaurantSchedule/);
  assert.match(page, /getSpecialDayCampaign/);
  assert.match(experience, /fetch\("\/api\/reservations"/);
  assert.match(experience, /fetch\("\/api\/schedule"/);
  assert.match(experience, /name="bookingDate"/);
  assert.match(experience, /name="startTime"/);
  assert.match(experience, /name="partySize"/);
  assert.match(experience, /name="dietaryRequirements"/);
  assert.match(experience, /name="accessibilityNeeds"/);
  assert.match(standardBooking, /getActiveBookingCampaign/);
  assert.match(standardBooking, /SpecialDayBookingExperience/);
  assert.doesNotMatch(standardBooking, /Open seasonal booking/);
  assert.doesNotMatch(standardBooking, /redirect\(/);
  assert.match(sitemap, /getLiveSpecialDayCampaigns/);
  assert.doesNotMatch(sitemap, /absoluteUrl\("\/special-days"\)/);
  assert.match(cms, /bookingExperienceSettingsQuery/);
  assert.match(cms, /specialDayCampaignQuery/);
  assert.match(cms, /getActiveBookingCampaign/);
});

test("the Christmas experience is interactive, accessible and mobile ready", async () => {
  const [experience, css] = await Promise.all([
    readFile(new URL("../app/christmas-booking/christmas-booking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/christmas-booking/christmas-booking.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /new AudioContext\(\)/);
  assert.match(experience, /new Audio\(campaign\.jingleUrl\)/);
  assert.match(experience, /campaign\.enableSound/);
  assert.match(experience, /aria-pressed=\{effectEnabled\}/);
  assert.match(experience, /campaign\.ambientEffect/);
  assert.match(experience, /role="tablist"/);
  assert.match(experience, /role="status"/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /@media \(max-width: 420px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /min-height: 3\.45rem/);
  assert.match(css, /--campaign-hero-mobile/);
});

test("special-day content and homepage posters are editable in Sanity", async () => {
  const [campaignSchema, routeSchema, campaignSelect, promotionSchema, home, popup] = await Promise.all([
    readFile(new URL("../studio/schemaTypes/documents/specialDayCampaign.ts", import.meta.url), "utf8"),
    readFile(new URL("../studio/schemaTypes/documents/bookingExperienceSettings.ts", import.meta.url), "utf8"),
    readFile(new URL("../studio/components/SpecialDayCampaignSelect.tsx", import.meta.url), "utf8"),
    readFile(new URL("../studio/schemaTypes/documents/promotion.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/promotion-popup.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(campaignSchema, /desktopHero/);
  assert.match(campaignSchema, /mobileHero/);
  assert.match(campaignSchema, /campaignPalette/);
  assert.match(routeSchema, /bookingMode/);
  assert.match(routeSchema, /activeCampaign/);
  assert.match(routeSchema, /components:\s*\{input:\s*SpecialDayCampaignSelect\}/);
  assert.match(campaignSelect, /Christmas and Onam can both remain Active/);
  assert.match(campaignSelect, /\/special-days\/\{campaign\.slug/);
  assert.match(promotionSchema, /popupDesktopPoster/);
  assert.match(promotionSchema, /popupMobilePoster/);
  assert.match(home, /getActivePromotions/);
  assert.match(popup, /popupMobilePoster/);
});

test("the Onam campaign has distinct responsive art and festival behaviour", async () => {
  const [migration, experience, schema, proxy] = await Promise.all([
    readFile(new URL("../scripts/apply-onam-campaign-sanity.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/christmas-booking/christmas-booking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../studio/schemaTypes/documents/specialDayCampaign.ts", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /slug = 'onam'/);
  assert.match(migration, /onam-booking-desktop\.png/);
  assert.match(migration, /onam-booking-mobile\.png/);
  assert.match(migration, /emblemStyle: 'floral'/);
  assert.match(migration, /ambientEffect: 'petals'/);
  assert.match(migration, /enableSound: false/);
  assert.match(experience, /styles\.floralMark/);
  assert.match(experience, /src="\/malabar\.png"/);
  assert.match(schema, /Falling flower petals/);
  assert.match(proxy, /img-src[^\n]+https:\/\/cdn\.sanity\.io/);
});
