import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('Facebook and TikTok are published and special events remain in the side navigation', async () => {
  const [settings, header, footer] = await Promise.all([
    readFile(new URL('../sanity/lib/site.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/components/site-header.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/components/site-footer.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(settings, /facebook\.com\/p\/Malabar-Coast-61589380673072/)
  assert.match(settings, /tiktok\.com\/@malabar\.coast/)
  assert.match(settings, /Special events/)
  assert.match(header, /Events & private dining/)
  assert.match(footer, /settings\.socialLinks\.map/)
})

test('story images use distinct documentary restaurant scenes and real plated dishes', async () => {
  const story = await readFile(new URL('../app/story/page.tsx', import.meta.url), 'utf8')
  for (const image of ['restaurant-kitchen-service.jpg', 'restaurant-spice-prep.jpg', 'restaurant-service-pass.jpg', 'restaurant-shared-table.jpg']) assert.match(story, new RegExp(image.replace('.', '\\.')))
  assert.match(story, /food\/Meen Moilee\.jpeg/)
  assert.match(story, /food\/chicken-chasni\.png/)
  assert.match(story, /food\/aatirachi kurumulak ittath\.jpeg/)
  assert.match(story, /story-table/)
})

test('intermediate tablet layouts keep signature and story content in normal flow', async () => {
  const [homeStyles, storyStyles] = await Promise.all([
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(new URL('../app/story/story-awwards.css', import.meta.url), 'utf8'),
  ])
  assert.match(homeStyles, /\.homeSignatureMenuCta \{[\s\S]*?position: static;[\s\S]*?grid-column: 2 \/ -1;/)
  assert.match(homeStyles, /@media \(max-width: 1024px\) and \(min-width: 721px\)/)
  assert.match(storyStyles, /@media \(max-width: 1024px\) \{[\s\S]*?\.storyManifestoCopy \{ grid-template-columns: 1fr;/)
})

test('drink prices stay hidden and source-backed allergen markers use the D/N/G key', async () => {
  const [catalogue, cmsMenu, experience] = await Promise.all([
    readFile(new URL('../app/lib/menu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../sanity/lib/menu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/menu/menu-experience.tsx', import.meta.url), 'utf8'),
  ])
  for (const category of ['soft-drinks', 'tea-coffee', 'draught-beer', 'bottled-beer-cider', 'spirits', 'wine', 'mixers']) assert.match(catalogue, new RegExp(category))
  assert.match(catalogue, /Ask the coastal crew/)
  assert.match(catalogue, /hidePrice: isDrink/)
  assert.match(catalogue, /onlineOrdering: isDrink \? false/)
  assert.match(cmsMenu, /const isDrink = drinkCategorySlugs\.has/)
  assert.match(experience, /formatAllergenSummary/)
  assert.match(experience, /AllergenMarker/)
  assert.match(experience, /Dairy/)
  assert.match(experience, /Nuts/)
  assert.match(experience, /Gluten/)
  assert.doesNotMatch(experience, /Allergens: confirmation required/)
})

test('the supplied September menu is mirrored in the fallback and safe CMS sync', async () => {
  const [catalogue, sync, schema] = await Promise.all([
    readFile(new URL('../app/lib/menu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/sync-menu-catalogue.ts', import.meta.url), 'utf8'),
    readFile(new URL('../studio/schemaTypes/documents/menuItem.ts', import.meta.url), 'utf8'),
  ])
  for (const category of ['Indian Snacks', 'Main Courses - Tikka Meals', 'King Prawn Curries']) assert.match(catalogue, new RegExp(category))
  for (const dish of ['Garlic Mushroom', 'Dragon Chicken Tikka', 'Neymeen Pollichathu', 'Calicut Halwa']) assert.match(catalogue, new RegExp(dish))
  assert.match(sync, /Malabar_Coast_Full_Menu_Updated\.pdf/)
  assert.match(sync, /protectedAllergenDeclarations/)
  assert.match(sync, /menuAllergenEvidence/)
  assert.match(sync, /sourceAllergenDeclarations/)
  assert.match(sync, /published: false, available: false, onlineOrdering: false/)
  assert.match(schema, /name: 'allergenReviewStatus'/)
  assert.match(schema, /allergenSource/)
  assert.match(schema, /allergenReviewedBy/)
  assert.match(schema, /allergenReviewedAt/)
})

test('the Chennai journey stop features a photorealistic masala dosa', async () => {
  const [menuFallback, syncScript] = await Promise.all([
    readFile(new URL('../sanity/lib/menu.ts', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/update-menu-regions.ts', import.meta.url), 'utf8'),
  ])
  for (const source of [menuFallback, syncScript]) {
    assert.match(source, /dosa-masala-dosa/)
    assert.match(source, /Chennai masala dosa\.jpeg/)
    assert.match(source, /courseLabel: 'Dosa'|course: "Dosa"/)
    assert.doesNotMatch(source, /area: ['"]Chennai['"][^\n]*Butter Chicken/)
  }
})

test('offers use a restaurant background and do not append a menu link to every card', async () => {
  const offers = await readFile(new URL('../app/offers/page.tsx', import.meta.url), 'utf8')
  const cardActions = offers.slice(offers.indexOf('promotion.callToAction'), offers.indexOf('promotion.terms'))
  assert.match(offers, /restaurant\/dining-room\.png/)
  assert.doesNotMatch(cardActions, /<Link href="\/menu">Explore the menu/)
})

test('guest-facing brand fallbacks contain no pictographic emoji', async () => {
  const brand = await readFile(new URL('../app/lib/brand-content.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(brand, /[\u{1F300}-\u{1FAFF}]/u)
})

test('hall event photography uses the enhanced venue set and remains responsive in the CMS model', async () => {
  const [hallPage, hallStyles, sectionSchema, pageQuery, syncScript] = await Promise.all([
    readFile(new URL('../app/hall/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/editorial.css', import.meta.url), 'utf8'),
    readFile(new URL('../studio/schemaTypes/objects/contentSection.ts', import.meta.url), 'utf8'),
    readFile(new URL('../sanity/lib/queries.ts', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/sync-hall-events.ts', import.meta.url), 'utf8'),
  ])
  for (const image of ['private-event-gathering.png', 'theatre-layout.png', 'room-layout.png']) {
    assert.match(hallPage, new RegExp(image.replace('.', '\\.')))
    assert.match(syncScript, new RegExp(image.replace('.', '\\.')))
  }
  assert.doesNotMatch(hallPage, /festive\d+\.jpeg/)
  assert.match(hallPage, /\(max-width: 600px\) 100vw/)
  assert.match(hallStyles, /hallGalleryGrid/)
  assert.match(hallStyles, /grid-template-columns: repeat\(12,minmax\(0,1fr\)\)/)
  assert.match(sectionSchema, /name: 'gallery'/)
  assert.match(pageQuery, /gallery\[\]/)
  assert.match(syncScript, /galleryImages: page\.gallery\.length/)
})

test('restaurant photography is responsive and represented in the CMS page', async () => {
  const [restaurantPage, editorialStyles, syncScript] = await Promise.all([
    readFile(new URL('../app/restaurant/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/editorial.css', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/sync-restaurant-gallery.ts', import.meta.url), 'utf8'),
  ])
  for (let index = 1; index <= 10; index += 1) assert.match(restaurantPage, new RegExp(`Store/${index}\\.jpeg`))
  assert.match(restaurantPage, /gallerySection\?\.gallery/)
  assert.match(restaurantPage, /restaurantGalleryGrid/)
  assert.match(editorialStyles, /\.restaurantGalleryGrid \{ display: grid; grid-template-columns: repeat\(12,minmax\(0,1fr\)\)/)
  assert.match(editorialStyles, /\.restaurantGalleryTile \{[^}]*height: clamp\(18rem,26vw,32rem\);/)
  assert.match(editorialStyles, /\.restaurantGalleryTile:nth-child\(1\),\.restaurantGalleryTile:nth-child\(6\),\.restaurantGalleryTile:nth-child\(10\) \{ grid-column: span 8; \}/)
  assert.doesNotMatch(editorialStyles, /\.restaurantGalleryTile:nth-child\(10\) \{ grid-column: 3 \/ 11;/)
  assert.match(editorialStyles, /@media \(max-width: 600px\)[\s\S]*?\.restaurantGalleryGrid \{ grid-template-columns: 1fr;/)
  assert.match(syncScript, /galleryImages: page\.gallery\.length/)
})

test('small-screen typography and shared controls stay readable and touch friendly', async () => {
  const [globalStyles, editorialStyles, menuStyles, storyStyles, adminStyles] = await Promise.all([
    readFile(new URL('../app/globals.css', import.meta.url), 'utf8'),
    readFile(new URL('../app/editorial.css', import.meta.url), 'utf8'),
    readFile(new URL('../app/menu/menu.css', import.meta.url), 'utf8'),
    readFile(new URL('../app/story/story-awwards.css', import.meta.url), 'utf8'),
    readFile(new URL('../app/admin/admin.css', import.meta.url), 'utf8'),
  ])
  assert.match(globalStyles, /\.siteHeader \.menuButton \{ width: 44px; height: 44px; min-height: 44px; \}/)
  assert.match(globalStyles, /\.careersEmpty a \{ display:inline-flex; min-height:44px;/)
  assert.match(globalStyles, /\.offersHero h1 \{ font-size:clamp\(3rem,15vw,3\.7rem\); overflow-wrap:normal; \}/)
  assert.match(editorialStyles, /\.hallEnquiryLead h2,[\s\S]*font-size: clamp\(3rem,15vw,3\.8rem\); overflow-wrap: normal;/)
  assert.match(menuStyles, /\.portContent h2 \{ font-size: clamp\(3rem,15vw,4\.25rem\); overflow-wrap: normal; \}/)
  assert.match(storyStyles, /\.calicutHero h1 \{ bottom: 10rem; left: 1rem; font-size: clamp\(5rem,25vw,8rem\);/)
  assert.match(adminStyles, /\.adminLoginCard h1 \{ font-size: clamp\(2\.2rem,10vw,3\.3rem\); overflow-wrap: normal; \}/)
})

test('long legal contact links wrap inside compact viewports', async () => {
  const legalStyles = await readFile(new URL('../app/legal.css', import.meta.url), 'utf8')
  assert.match(legalStyles, /\.legalSectionBody a \{[^}]*overflow-wrap: anywhere;[^}]*word-break: break-word;/)
})

test('the private login card stays inside a 320px viewport', async () => {
  const adminStyles = await readFile(new URL('../app/admin/admin.css', import.meta.url), 'utf8')
  assert.match(adminStyles, /\.adminLoginCard \{[^}]*box-sizing: border-box;/)
})
