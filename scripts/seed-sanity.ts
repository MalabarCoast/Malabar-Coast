import {createReadStream, existsSync} from "node:fs";
import {basename, join} from "node:path";
import {createClient} from "next-sanity";
import {faqItems} from "../app/lib/faq";
import {menuCategories, menuItems} from "../app/lib/menu";
import {foodOfMalabarContent, malabarCoastIntroduction, ourInspirationContent, ourRestaurantsContent} from "../app/lib/brand-content";
import {site} from "../app/lib/site";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_API_TOKEN?.trim();

if (!projectId || !token) throw new Error("Sanity project configuration or server token is missing.");

const client = createClient({projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false});
const publicDirectory = join(process.cwd(), "public");

const imageFiles = {
  logo: "malabar.png",
  lightLogo: "malabar.png",
  hero: "malabar-restaurant-hero-v2.jpg",
  hallEventGathering: "hall/private-event-gathering.png",
  hallTheatreLayout: "hall/theatre-layout.png",
  hallRoomLayout: "hall/room-layout.png",
  diningRoom: "restaurant/dining-room.png",
  tableForTwo: "restaurant/table-for-two.png",
  archedPassage: "restaurant/arched-passage.png",
  storyPort: "story/calicut-spice-port.png",
  storyPepper: "story/pepper-balance.png",
  storyGhats: "story/western-ghats.png",
  storyRestaurantKitchen: "story/restaurant-kitchen-service.jpg",
  storyRestaurantSpices: "story/restaurant-spice-prep.jpg",
  storyRestaurantPass: "story/restaurant-service-pass.jpg",
  storyRestaurantTable: "story/restaurant-shared-table.jpg",
  calicutPrawns: "menu/calicut-pepper-prawns.png",
  malindiFish: "menu/malindi-sea-bass.png",
  mozambiqueShellfish: "menu/mozambique-lobster.png",
  capeLamb: "menu/cape-malay-lamb.png",
  lisbonDessert: "menu/lisbon-custard-tart.png",
  scotlandFish: "menu/scotland-haddock.png",
  chickenTikka: "menu/chicken-tikka.png",
  tandooriChicken: "menu/tandoori-chicken.png",
  chickenShashlik: "menu/chicken-shashlik.png",
  lambTikka: "menu/lamb-tikka.png",
  chickenBiriyani: "menu/chicken-biriyani.png",
  gulabJamun: "menu/gulab-jamun.png",
  foodMeenMoilee: "food/Meen Moilee.jpeg",
  foodLambPepper: "food/aatirachi kurumulak ittath.jpeg",
  foodGrillFish: "food/Masala grill fish.jpeg",
  foodChickenChasni: "food/chicken-chasni.png",
  foodPeshwari: "food/Peshwari naan.jpeg",
  foodChennaiDosa: "food/Chennai masala dosa.jpeg",
  foodButterChickenCombo: "food/Garlic naan butter chicken combo.jpeg",
  christmasHero: "christmas/christmas-booking-hero.png",
  christmasDayOffer: "offers/christmas-day-booking-2026.png",
} as const;

type AssetKey = keyof typeof imageFiles;
const assetIds = new Map<AssetKey, string>();

async function uploadImage(key: AssetKey) {
  const relativePath = imageFiles[key];
  const absolutePath = join(publicDirectory, relativePath);
  if (!existsSync(absolutePath)) throw new Error(`Missing website image: ${relativePath}`);
  const filename = basename(relativePath);
  const existingId = await client.fetch<string | null>(`*[_type == "sanity.imageAsset" && originalFilename == $filename][0]._id`, {filename});
  if (existingId) {
    assetIds.set(key, existingId);
    return existingId;
  }
  const asset = await client.assets.upload("image", createReadStream(absolutePath), {filename});
  assetIds.set(key, asset._id);
  return asset._id;
}

function image(key: AssetKey, alt: string) {
  const assetId = assetIds.get(key);
  if (!assetId) throw new Error(`Image was not uploaded: ${key}`);
  return {_type: "image", asset: {_type: "reference", _ref: assetId}, alt};
}

function block(text: string, key: string) {
  return {_type: "block", _key: key, style: "normal", markDefs: [], children: [{_type: "span", _key: `${key}-text`, text, marks: []}]};
}

async function upsertByField(type: string, field: string, value: string, document: Record<string, unknown>) {
  const existingId = await client.fetch<string | null>(`*[_type == $type && ${field} == $value][0]._id`, {type, value});
  if (existingId) {
    await client.patch(existingId).set(document).commit();
    return existingId;
  }
  const created = await client.create({_type: type, ...document});
  return created._id;
}

const faqLegacyQuestions: Record<string, readonly string[]> = {
  "licensed-alcohol": ["Does the Malabar Coast serve alcohol?"],
  "private-hall": ["Does Malabar Coast have a private event hall?"],
  "hall-facilities": ["Which facilities are included in the private hall?"],
  "hall-enquiries": ["How can I book the Malabar Coast hall?"],
};

async function upsertFaq(faq: (typeof faqItems)[number], displayOrder: number) {
  const questions = [faq.question, ...(faqLegacyQuestions[faq.id] || [])];
  const existingId = await client.fetch<string | null>(`*[_type == "faqItem" && question in $questions][0]._id`, {questions});
  const document = {
    question: faq.question,
    answer: faq.answer,
    category: ["private-hall", "hall-facilities", "hall-enquiries"].includes(faq.id) ? "The Kerala Suite" : "Restaurant",
    displayOrder,
    published: true,
  };
  if (existingId) {
    await client.patch(existingId).set(document).commit();
    return existingId;
  }
  return (await client.create({_type: "faqItem", ...document}))._id;
}

const pageSeeds = (itemIds: Map<string, string>) => [
  {
    pageKey: "home",
    title: "Home",
    eyebrow: "Indian Cuisine & Bar · Holytown",
    heroHeading: "From the Malabar Coast to Scotland.",
    heroText: "Tandoor fire, fragrant biriyani, rich curries and Malabar coastal flavours, served with a full bar in the heart of Holytown.",
    heroImage: image("hero", "A Kerala-inspired restaurant table with coastal dishes in a warm dining room"),
    heroPrimaryLink: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    heroSecondaryLink: {_type: "link", label: "Book your table", href: "/book-a-table", openInNewTab: false},
    heroTertiaryLink: {_type: "link", label: "Book the private hall", href: "/hall", openInNewTab: false},
    sections: [
      {_type: "contentSection", _key: "home-overview", internalName: "What is Malabar Coast?", eyebrow: "Our restaurant", heading: "What is Malabar Coast?", body: malabarCoastIntroduction.map((paragraph,index)=>block(paragraph, `overview-copy-${index+1}`)), image: image("diningRoom", "The warmly lit Malabar Coast dining room")},
      {_type: "contentSection", _key: "home-menu", internalName: "Signature menu", eyebrow: "From coast and tandoor", heading: "Come to the table.", body: [block("From tandoor-charred Chicken Tikka to coconut-rich coastal plates and slow-cooked lamb, our table travels across India.", "menu-copy")], image: image("chickenTikka", "Charred chicken tikka with red onion and grilled lemon"), featuredDishes: [
        {_type: "object", _key: "konju-coconut-fry", dish: {_type: "reference", _ref: itemIds.get("malabar-coast-signature-konju-coconut-fry")!}, image: image("calicutPrawns", "Black pepper tiger prawns with curry leaf and charred lime"), note: "From Calicut · Small plate"},
        {_type: "object", _key: "chicken-tikka", dish: {_type: "reference", _ref: itemIds.get("clay-oven-chicken-tikka")!}, image: image("chickenTikka", "Charred chicken tikka with red onion and grilled lemon"), note: "From Delhi · Tandoor fire"},
        {_type: "object", _key: "aattirachi-kurumulak", dish: {_type: "reference", _ref: itemIds.get("malabar-coast-signature-aattirachi-kurumulak")!}, image: image("capeLamb", "Pepper-spiced lamb with flaky porotta"), note: "From the fire · Made for sharing"},
      ]},
      {_type: "contentSection", _key: "home-story", internalName: "Coastal story", eyebrow: "Our story", heading: "A coast that changed the table.", body: [block("Follow the old sea road from Calicut to the new coast in Scotland.", "story-copy")], image: image("storyPort", "A rain-washed historic spice port on the Malabar Coast")},
      {_type: "callToAction", _key: "home-reservations", eyebrow: "Book your table", heading: "Your table by the coast.", text: "Choose your date, arrival time and party size online, with live capacity checked before confirmation.", primaryLink: {_type: "link", label: "Book your table", href: "/book-a-table", openInNewTab: false}, secondaryLink: {_type: "link", label: "Get directions", href: site.maps.directionsUrl, openInNewTab: true}, image: image("tableForTwo", "An intimate table for two at Malabar Coast")},
    ],
    seo: {title: "Malabar Coast UK | Indian Restaurant & Bar in Holytown", description: "Malabar Coast serves Indian tandoor dishes, curries, biriyani and coastal specialities in Holytown, Scotland."},
  },
  {
    pageKey: "restaurant",
    title: "Restaurant",
    eyebrow: "Our restaurant · Holytown",
    heroHeading: "Let us take you to the coast.",
    heroText: "A neighbourhood dining room for the bright, generous cooking of Kerala and India's southern coast.",
    heroImage: image("diningRoom", "The warmly lit Malabar Coast dining room with teak, cane and brass details"),
    sections: [
      {_type: "contentSection", _key: "restaurant-restaurants", internalName: "Our Restaurants", eyebrow: ourRestaurantsContent.title, heading: ourRestaurantsContent.subtitle, body: [...ourRestaurantsContent.paragraphs.map((paragraph,index)=>block(paragraph, `restaurants-copy-${index+1}`)), block(ourRestaurantsContent.locationTitle, "restaurants-location-title"), block(ourRestaurantsContent.address, "restaurants-location-address")]},
      {_type: "contentSection", _key: "restaurant-food", internalName: "The Food of Malabar", eyebrow: foodOfMalabarContent.title, heading: foodOfMalabarContent.subtitle, body: foodOfMalabarContent.paragraphs.map((paragraph,index)=>block(paragraph, `food-copy-${index+1}`))},
      {_type: "contentSection", _key: "restaurant-welcome", internalName: "Welcome", eyebrow: "A warm arrival", heading: "Welcomed like home.", body: [block("Come for a quick supper, a long family table or a celebration. The welcome is relaxed, the plates are made for sharing, and there is always room for one more.", "welcome-copy")], image: image("tableForTwo", "A warm table setting at Malabar Coast")},
      {_type: "contentSection", _key: "restaurant-room", internalName: "The room", eyebrow: "Material and memory", heading: "Grounded in the coast.", body: [block("Dark teak, aged brass, cane, lime plaster, linen and laterite tones bring Kerala's textures into a contemporary Scottish dining room.", "room-copy")], image: image("archedPassage", "A plaster arch and teak screen leading into the dining room")},
      {_type: "callToAction", _key: "restaurant-hall", eyebrow: "Private gatherings", heading: "A room of your own.", text: "A flexible private hall with a built-in bar, raised stage and open floor.", primaryLink: {_type: "link", label: "Explore the private hall", href: "/hall", openInNewTab: false}, image: image("hallRoomLayout", "The private hall with stage and flexible seating")},
    ],
    seo: {title: "Restaurant in Holytown", description: "Coastal South Indian cooking and warm hospitality at Malabar Coast in Holytown."},
  },
  {
    pageKey: "hall",
    title: "Private hall",
    eyebrow: "Private gatherings · Holytown",
    heroHeading: "A room of your own.",
    heroText: "A flexible event space within the restaurant with a built-in wooden bar, raised stage and open floor.",
    heroImage: image("hallEventGathering", "Guests gathered in the Malabar Coast private hall for a family celebration"),
    heroPrimaryLink: {_type: "link", label: "Start your enquiry", href: "#hall-enquiry", openInNewTab: false},
    heroSecondaryLink: {_type: "link", label: "Book a restaurant table", href: "/book-a-table", openInNewTab: false},
    sections: [
      {_type: "contentSection", _key: "hall-intro", internalName: "Gather by the coast", eyebrow: "The private hall", heading: "Gather by the coast.", body: [block("The room can move from an open reception to seated arrangements without losing its warm, understated character. Capacity, packages, catering choices and pricing remain subject to restaurant confirmation.", "hall-copy")], image: image("hallRoomLayout", "Open floor, table layout and stage in the private hall"), items: [
        {_type: "object", _key: "dedicated", shortLabel: "01", title: "Dedicated space", text: "A private room within the restaurant"},
        {_type: "object", _key: "bar", shortLabel: "02", title: "At one end", text: "A built-in wooden bar"},
        {_type: "object", _key: "stage", shortLabel: "03", title: "At the other", text: "A raised event stage"},
        {_type: "object", _key: "floor", shortLabel: "04", title: "Through the room", text: "A flexible open floor"},
      ]},
      {_type: "contentSection", _key: "hall-stage", internalName: "The stage", eyebrow: "A natural focal point", heading: "A natural focal point.", body: [block("The raised stage anchors the far end of the room for speeches, presentations and moments shared together.", "stage-copy")], image: image("hallTheatreLayout", "The Malabar Coast private hall arranged with theatre seating and its built-in bar")},
      {_type: "contentSection", _key: "hall-gallery", internalName: "Celebrations in the hall", eyebrow: "Real gatherings · Real layouts", heading: "Made for the moment.", image: image("hallRoomLayout", "The private hall set with tables and seating facing the decorated stage"), gallery: [
        {...image("hallEventGathering", "Guests gathered in the Malabar Coast private hall for a family celebration"), _key: "hall-event-gathering", caption: "A real celebration in the room"},
        {...image("hallTheatreLayout", "The Malabar Coast private hall arranged with theatre seating and its built-in bar"), _key: "hall-theatre-layout", caption: "Theatre layout and bar"},
        {...image("hallRoomLayout", "The private hall set with tables and seating facing the decorated stage"), _key: "hall-room-layout", caption: "Flexible tables and stage"},
      ]},
      {_type: "contentSection", _key: "hall-occasions", internalName: "Occasions", eyebrow: "Made for your people", heading: "One room. Many reasons.", body: [block("Shape the hall around the occasion, from a lively family celebration to a calm community gathering. Tell us what matters and we will help you find the right setup.", "hall-occasions-copy")], items: [
        {_type: "object", _key: "milestones", shortLabel: "01", title: "Milestones", text: "Birthdays, anniversaries and family celebrations"},
        {_type: "object", _key: "receptions", shortLabel: "02", title: "Receptions", text: "A flexible floor for welcoming, dining and dancing"},
        {_type: "object", _key: "community", shortLabel: "03", title: "Community", text: "Meetings, presentations and shared occasions"},
        {_type: "object", _key: "private-dining", shortLabel: "04", title: "Private dining", text: "A more intimate room with Malabar Coast catering"},
      ]},
      {_type: "contentSection", _key: "hall-planning", internalName: "Planning journey", eyebrow: "From idea to occasion", heading: "A simple way to begin.", body: [block("No polished plan is needed. Share the date, guest estimate and the feeling you want; our team will take it from there.", "hall-planning-copy")], items: [
        {_type: "object", _key: "send", shortLabel: "01", title: "Send the basics", text: "Date, time, guest estimate and occasion."},
        {_type: "object", _key: "shape", shortLabel: "02", title: "Shape it together", text: "Discuss layout, catering, stage and access needs."},
        {_type: "object", _key: "confirm", shortLabel: "03", title: "Confirm with confidence", text: "The team confirms availability, details and price directly."},
      ]},
      {_type: "contentSection", _key: "hall-enquiry", internalName: "Hall enquiry", eyebrow: "Your occasion · Holytown", heading: "Bring people together.", body: [block("Tell us the basics now. The team will review your request and call or email you before anything is confirmed.", "hall-enquiry-copy")], items: [
        {_type: "object", _key: "no-commitment", shortLabel: "01", title: "No payment or commitment at this stage"},
        {_type: "object", _key: "personal-confirmation", shortLabel: "02", title: "Availability confirmed personally by our team"},
        {_type: "object", _key: "plan-together", shortLabel: "03", title: "Layout, catering and access planned together"},
      ]},
      {_type: "contentSection", _key: "hall-faq", internalName: "Hall FAQ heading", eyebrow: "Before you plan · 04", heading: "Good to know."},
      {_type: "contentSection", _key: "hall-closing", internalName: "Hall closing", eyebrow: "See it for yourself · Holytown", heading: "Come and see the room.", body: [block("Explore the location, look through the menu, or return to the enquiry above when you are ready. You do not need a finished plan to start the conversation.", "hall-closing-copy")]},
    ],
    seo: {title: "Private Event Hall in Holytown", description: "A private event hall at Malabar Coast with a bar, stage and flexible floor."},
  },
  {
    pageKey: "story",
    title: "Our story",
    eyebrow: "Our story · Chapter I",
    heroHeading: "A coast that changed the table.",
    heroText: "A coastline shaped by rain, trade and welcome, where food became a language long before it became a menu.",
    heroImage: image("storyRestaurantKitchen", "A restaurant cook finishing a coconut fish curry during service"),
    sections: [
      {_type: "contentSection", _key: "story-inspiration", internalName: "Our Inspiration", eyebrow: ourInspirationContent.title, heading: ourInspirationContent.subtitle, body: ourInspirationContent.paragraphs.map((paragraph,index)=>block(paragraph, `inspiration-copy-${index+1}`))},
      {_type: "contentSection", _key: "story-pepper", internalName: "Pepper", eyebrow: "Chapter I", heading: "The pepper coast", body: [block("For over 3,000 years, travellers came for black pepper, cardamom, cinnamon and cloves.", "pepper-copy")], image: image("storyRestaurantSpices", "A restaurant cook crushing black pepper and cardamom in a stone mortar during preparation")},
      {_type: "contentSection", _key: "story-monsoon", internalName: "Monsoon", eyebrow: "Chapter II", heading: "The monsoon road.", body: [block("Seasonal winds connected the Malabar Coast with distant ports across the Indian Ocean.", "monsoon-copy")], image: image("storyRestaurantPass", "A cook passing a bowl of coconut fish curry to the restaurant service team")},
      {_type: "callToAction", _key: "story-table", eyebrow: "The living landscape", heading: "History, still alive.", text: "The old sea road is still present in the pepper, coconut and cardamom cooked with every day.", primaryLink: {_type: "link", label: "View the menu", href: "/menu", openInNewTab: false}, image: image("storyRestaurantTable", "Guests passing appam across a shared table of Kerala dishes")},
    ],
    seo: {title: "Our Story: From Malabar to Scotland", description: "Follow the food story from Calicut's spice ports to the Malabar Coast table in Holytown."},
  },
  {
    pageKey: "story-calicut",
    title: "Calicut story",
    eyebrow: "Archive 01 · The first port",
    heroHeading: "Calicut.",
    heroText: "Long before it appeared in a recipe book, Malabar pepper was measured here by hand and carried by the turning winds.",
    heroImage: image("storyPort", "The historic spice port of Calicut opening onto the Arabian Sea"),
    sections: [
      {_type: "contentSection", _key: "calicut-intro", internalName: "The beginning", eyebrow: "01 / The beginning", heading: "The harbour where flavour became history.", note: "Arabian Sea · Monsoon season", body: [block("Calicut was less a border than a threshold, the place where soil, sea and distant tables met.", "calicut-intro-copy")]},
      {_type: "contentSection", _key: "calicut-pepper", internalName: "Black gold", eyebrow: "The black gold of Malabar", heading: "Small enough to hold between two fingers. Valuable enough to redraw the world.", body: [block("Pepper thrived in the wet shade of the Western Ghats. Its clean, floral heat made it currency, medicine and obsession in ports thousands of miles away.", "calicut-pepper-copy")], image: image("storyPepper", "Peppercorns weighed on a brass merchant's balance")},
      {_type: "contentSection", _key: "calicut-monsoon", internalName: "Monsoon landscape", image: image("storyGhats", "Pepper vines climbing through the monsoon forest of the Western Ghats")},
      {_type: "contentSection", _key: "calicut-exchange", internalName: "Living exchange", eyebrow: "Port ledger · A living exchange", heading: "What arrived. What remained.", items: [
        {_type: "object", _key: "arabia", shortLabel: "01", title: "Arabia", text: "Rice, perfume, a language of hospitality"},
        {_type: "object", _key: "china", shortLabel: "02", title: "China", text: "Ceramics, fishing nets, quiet craft"},
        {_type: "object", _key: "portugal", shortLabel: "03", title: "Portugal", text: "Chilli, vinegar, a new kind of heat"},
        {_type: "object", _key: "malabar", shortLabel: "04", title: "Malabar", text: "Pepper, coconut, generosity without end"},
      ]},
      {_type: "contentSection", _key: "calicut-next", internalName: "Return link", eyebrow: "Return to the full journey", heading: "Our story"},
    ],
    seo: {title: "Calicut: The First Spice Port", description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast."},
  },
  {
    pageKey: "book-a-table",
    title: "Book a table",
    eyebrow: "Book your table · Holytown",
    heroHeading: "Come sit by the coast.",
    heroText: "Choose a date, arrival time and party size. Live restaurant capacity is checked before your table is confirmed.",
    heroPrimaryLink: {_type: "link", label: "See what's cooking", href: "/menu"},
    heroSecondaryLink: {_type: "link", label: "Planning something bigger?", href: "/hall"},
    sections: [{_type: "contentSection", _key: "booking-details", internalName: "Before you book", eyebrow: "Before you book", heading: "A table prepared for your people."}],
    seo: {title: "Book a Table", description: "Reserve a table at Malabar Coast in Holytown."},
  },
  {
    pageKey: "offers",
    title: "Offers",
    eyebrow: "Current offers · From the coast",
    heroHeading: "Offers & specials.",
    heroText: "Seasonal plates, dining offers and moments worth gathering for. Every live offer and its terms are shown below.",
    heroImage: image("diningRoom", "The dining room at Malabar Coast"),
    seo: {title: "Offers & Promotions", description: "Current dining, collection and seasonal offers from Malabar Coast in Holytown."},
  },
  {
    pageKey: "faq",
    title: "FAQs",
    eyebrow: "Good to know · Clear answers",
    heroHeading: "Before you come ashore.",
    heroText: "Direct answers about the food, private hall, dietary choices, location and ordering at Malabar Coast in Holytown.",
    sections: [{_type: "contentSection", _key: "faq-closing", internalName: "Closing prompt", eyebrow: "Ready for the table?", heading: "Follow the flavour."}],
    seo: {title: "Restaurant FAQs", description: "Answers about dining, the private hall, ordering and Southern Indian coastal food at Malabar Coast."},
  },
];

async function seed() {
  for (const key of Object.keys(imageFiles) as AssetKey[]) await uploadImage(key);

  const categoryIds = new Map<string, string>();
  for (const category of menuCategories) {
    const id = await upsertByField("menuCategory", "slug.current", category.slug, {
      title: category.title,
      slug: {_type: "slug", current: category.slug},
      shortTitle: category.note,
      eyebrow: category.note,
      description: category.description,
      orderRank: category.orderRank,
      published: true,
    });
    categoryIds.set(category.slug, id);
  }

  const itemIds = new Map<string, string>();
  const itemImages: Partial<Record<string, {key: AssetKey; alt: string}>> = {
    "malabar-coast-signature-konju-coconut-fry": {key: "calicutPrawns", alt: "A coastal prawn dish with curry leaf"},
    "malabar-coast-signature-masala-grilled-fish": {key: "malindiFish", alt: "Masala grilled fish with herbs and citrus"},
    "malabar-coast-signature-prawn-moilee": {key: "mozambiqueShellfish", alt: "Coastal shellfish with fragrant rice and lime"},
    "malabar-coast-signature-aattirachi-kurumulak": {key: "capeLamb", alt: "Pepper-spiced lamb with flaky porotta"},
    "desserts-malabar-coast-special-dessert": {key: "lisbonDessert", alt: "A warm spiced dessert"},
    "malabar-coast-signature-meen-moilee": {key: "scotlandFish", alt: "Fish in a golden coconut moilee"},
    "clay-oven-chicken-tikka": {key: "chickenTikka", alt: "Charred chicken tikka with red onion and grilled lemon"},
    "clay-oven-tandoori-chicken": {key: "tandooriChicken", alt: "Bone-in tandoori chicken with grilled lemon"},
    "clay-oven-chicken-shashlik": {key: "chickenShashlik", alt: "Chicken shashlik skewers with peppers and onion"},
    "clay-oven-lamb-tikka": {key: "lambTikka", alt: "Aromatic lamb tikka with charred lemon"},
    "biriyani-chicken": {key: "chickenBiriyani", alt: "Fragrant chicken biriyani with saffron rice"},
    "desserts-gulab-jamun": {key: "gulabJamun", alt: "Gulab jamun in cardamom and saffron syrup"},
  };
  for (const menuItem of menuItems) {
    const categoryId = categoryIds.get(menuItem.category);
    if (!categoryId) throw new Error(`Category reference missing for ${menuItem.id}`);
    const imageSeed = itemImages[menuItem.id];
    const document: Record<string, unknown> = {
      published: true,
      name: menuItem.name,
      slug: {_type: "slug", current: menuItem.id},
      sourceKey: menuItem.id,
      category: {_type: "reference", _ref: categoryId},
      description: menuItem.description,
      subheading: menuItem.subheading,
      pricePence: menuItem.isAlcoholic ? null : menuItem.pricePence,
      priceLabel: menuItem.priceLabel,
      hidePrice: menuItem.isAlcoholic || menuItem.hidePrice,
      isAlcoholic: menuItem.isAlcoholic,
      isVegetarian: menuItem.dietaryStatus === "vegetarian" || menuItem.dietaryStatus === "vegan",
      isVegan: menuItem.dietaryStatus === "vegan",
      dietaryReviewStatus: "needs-review",
      dietaryNotes: menuItem.dietaryStatus === "notApplicable" ? "Dietary label not applicable." : "Classification inferred from the supplied menu name; the restaurant must confirm the current recipe.",
      spiceLevel: "none",
      available: menuItem.available,
      onlineOrdering: menuItem.onlineOrdering,
      featured: menuItem.featured,
      displayOrder: menuItem.displayOrder,
      ...(imageSeed ? {image: image(imageSeed.key, imageSeed.alt)} : {}),
    };
    const id = await upsertByField("menuItem", "sourceKey", menuItem.id, document);
    itemIds.set(menuItem.id, id);
  }

  const voyageSeeds = [
    ["malabar-coast-signature-meen-moilee", "Kochi", "Kerala", "9.9312° N · 76.2673° E", "Arabian Sea harbour", "Meen Moilee", "foodMeenMoilee", "Meen Moilee served at Malabar Coast", "A gentle fish and coconut curry that keeps Kerala's coastal cooking at the heart of the journey."],
    ["malabar-coast-signature-aattirachi-kurumulak", "Kozhikode", "Kerala", "11.2588° N · 75.7804° E", "Historic spice port", "Aattirachi Kurumulak", "foodLambPepper", "Aattirachi Kurumulak served at Malabar Coast", "Pepper-led lamb recalls the spice trade that made Kozhikode one of the coast's great meeting places."],
    ["malabar-coast-signature-masala-grilled-fish", "Mangaluru", "Karnataka coast", "12.9141° N · 74.8560° E", "Western coast", "Masala Grilled Fish", "foodGrillFish", "Masala grilled fish served at Malabar Coast", "Masala-coated grilled fish carries the bright heat and sea-facing character of India's western coast."],
    ["chicken-chicken-chasni", "Mumbai", "Maharashtra", "19.0760° N · 72.8777° E", "Gateway harbour", "Chicken Chasni", "foodChickenChasni", "Creamy chicken chasni served at Malabar Coast", "A creamy, gently sweet-and-tangy chicken curry for a city whose tables bring regional flavours together."],
    ["breads-peshwari-naan", "Surat", "Gujarat", "21.1702° N · 72.8311° E", "Gulf of Khambhat", "Peshwari Naan", "foodPeshwari", "Peshwari naan served at Malabar Coast", "A fragrant, fruit-and-nut-filled naan marks Gujarat on the west-coast route with a sweet counterpoint."],
    ["dosa-masala-dosa", "Chennai", "Tamil Nadu", "13.0827° N · 80.2707° E", "Coromandel coast", "Dosa", "foodChennaiDosa", "Chennai-style masala dosa served with sambar and chutneys", "A crisp masala dosa brings Tamil Nadu’s griddle tradition to the final stop on the Coromandel Coast."],
  ] as const;
  await client.createOrReplace({
    _id: "menuPage",
    _type: "menuPage",
    eyebrow: "India's port kitchens · Coast to coast",
    headingLineOne: "Six ports.",
    headingLineTwo: "One table.",
    introduction: "Follow the sea route from Kerala's Kochi and Kozhikode to Mangaluru, Mumbai, Surat and Chennai, paired with real dishes served at Malabar Coast.",
    journeyLinkLabel: "Explore the port cities",
    manifestEyebrow: "The full menu",
    manifestHeading: "What we carry to the table.",
    manifestIntroduction: "The current Malabar Coast menu, prepared for sharing and available to order online where shown.",
    dietaryNotice: "D means dairy, N means nuts and G means gluten. Only the restaurant-supplied markers are shown. Please tell the team about all allergies before ordering because recipes can change and cross-contact may occur.",
    alcoholNotice: "Drink prices are not published online. Please ask the coastal crew for current soft drink, hot drink, mixer and bar prices. Drinks are not available through online ordering.",
    menuInterludes: [
      {_type: "object", _key: "after-beef", afterCategory: {_type: "reference", _ref: categoryIds.get("beef")!}, image: image("foodChickenChasni", "Creamy chicken chasni served at Malabar Coast"), eyebrow: "From the curry pot", title: "Creamy, bright and gently tangy."},
      {_type: "object", _key: "after-rice", afterCategory: {_type: "reference", _ref: categoryIds.get("rice")!}, image: image("foodMeenMoilee", "Meen Moilee fish curry served at Malabar Coast"), eyebrow: "From the coast", title: "Coconut, curry leaf and a gentler tide."},
    ],
    voyageStops: voyageSeeds.map(([itemId, area, region, coordinates, yearLabel, courseLabel, imageKey, alt, description], index) => ({
      _type: "object", _key: `voyage-${index + 1}`, dish: {_type: "reference", _ref: itemIds.get(itemId)!}, area, region, coordinates, yearLabel, courseLabel, image: image(imageKey, alt), description,
    })),
    seo: {title: "Indian Cuisine & Bar Menu in Holytown", description: "Explore tandoori chicken, chicken tikka, biriyani, curries, vegetarian dishes, Malabar coastal specialities and desserts at Malabar Coast."},
  });

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    restaurantName: "Malabar Coast",
    legalName: "Malabar Coast",
    shortDescription: "Indian Cuisine & Bar, from tandoor fire to the Malabar coast.",
    description: "Malabar Coast is an Indian restaurant and bar in Holytown, Scotland, serving tandoor dishes, curries, biriyani, vegetarian plates and Malabar coastal specialities.",
    establishedDate: "2026-06-01",
    logo: image("logo", "Malabar Coast logo"),
    lightLogo: image("lightLogo", "Malabar Coast white logo"),
    siteUrl: "https://www.malabarcoast.co.uk",
    email: "reservations@malabarcoast.co.uk",
    reservationEmail: "reservations@malabarcoast.co.uk",
    footerEyebrow: "Stay close to the coast",
    footerHeading: "Our socials",
    footerText: "Follow the kitchen, new dishes and moments from Malabar Coast.",
    footerCreditLabel: "Made by Codrantlabs.in",
    footerCreditUrl: "https://codrantlabs.in/",
    address: {streetAddress: "33 Main Street", locality: "Holytown", region: "North Lanarkshire", postalCode: "ML1 4TH", country: "GB"},
    coordinates: {latitude: site.geo.latitude, longitude: site.geo.longitude},
    mapUrl: site.maps.directionsUrl,
    mapEmbedUrl: site.maps.embedUrl,
    openingHours: [{_key: "monday-closed", days: "Monday", hours: "Usually closed"}],
    socialLinks: [
      {_key: "instagram", platform: "Instagram", url: "https://www.instagram.com/malabarcoastuk"},
      {_key: "facebook", platform: "Facebook", url: "https://www.facebook.com/p/Malabar-Coast-61589380673072/"},
      {_key: "tiktok", platform: "TikTok", url: "https://www.tiktok.com/@malabar.coast"},
    ],
    primaryNavigation: [
      {_type: "link", _key: "story", label: "Our story", href: "/story", openInNewTab: false},
      {_type: "link", _key: "menu", label: "The menu", href: "/menu", openInNewTab: false},
      {_type: "link", _key: "offers", label: "Offers & specials", href: "/offers", openInNewTab: false},
      {_type: "link", _key: "book", label: "Book a table", href: "/book-a-table", openInNewTab: false},
      {_type: "link", _key: "restaurant", label: "Our restaurant", href: "/restaurant", openInNewTab: false},
      {_type: "link", _key: "hall", label: "Special events", eyebrow: "Events & private dining", description: "Celebrate, gather and enquire about the private event space", href: "/hall", openInNewTab: false},
      {_type: "link", _key: "faq", label: "Good to know", href: "/faq", openInNewTab: false},
      {_type: "link", _key: "order", label: "Your order", href: "/checkout", openInNewTab: false},
    ],
    footerNavigation: [
      {_type: "link", _key: "payments", label: "Payments", href: "/payments", openInNewTab: false},
      {_type: "link", _key: "returns", label: "Returns", href: "/returns", openInNewTab: false},
      {_type: "link", _key: "cookie", label: "Cookie", href: "/cookie", openInNewTab: false},
      {_type: "link", _key: "privacy", label: "Privacy", href: "/privacy", openInNewTab: false},
    ],
    copyrightText: "© 2026 Malabar Coast™. All rights reserved.",
    defaultSeo: {title: "Malabar Coast UK | Indian Restaurant & Bar in Holytown", description: "Indian tandoor dishes, curries, biriyani and Malabar coastal cooking in Holytown, Scotland.", image: image("hero", "An Indian restaurant table with tandoor and coastal dishes")},
  });

  const marketingPages = pageSeeds(itemIds);
  for (const page of marketingPages) await upsertByField("marketingPage", "pageKey", page.pageKey, page);
  for (const [index, faq] of faqItems.entries()) await upsertFaq(faq, index);

  const testimonials = [
    {name: "Just Eat guests", source: "Independent delivery platform", rating: 4.75, quote: "Eight early diners placed Malabar Coast at 4.75 out of 5, a warm first word from Holytown."},
    {name: "Uber Eats guests", source: "Independent delivery platform", rating: 5, quote: "The first two ratings arrived as a perfect 5.0 out of 5, carrying the earliest taste of the kitchen beyond our doors."},
  ];
  for (const [index, testimonial] of testimonials.entries()) await upsertByField("testimonial", "name", testimonial.name, {...testimonial, displayOrder: index, published: true});

  const specialMenuItem = menuItems.find((item) => item.id === "malabar-coast-signature-konju-coconut-fry");
  const specialMenuItemId = itemIds.get("malabar-coast-signature-konju-coconut-fry");
  if (specialMenuItem && specialMenuItemId && specialMenuItem.pricePence != null) {
    await upsertByField("dailySpecial", "menuItem._ref", specialMenuItemId, {
      status: "active",
      badge: "Today from the kitchen",
      priceNote: "While today's batch lasts",
      dietaryNote: "Please tell the team about allergies before ordering.",
      menuItem: {_type: "reference", _ref: specialMenuItemId},
      activeDays: ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      displayOrder: 10,
    });
  }

  await upsertByField("promotion", "slug.current", "coastal-weekday-table", {
    title: "The coastal weekday table",
    slug: {_type: "slug", current: "coastal-weekday-table"},
    status: "paused",
    poster: image("foodButterChickenCombo", "Garlic naan and butter chicken served at Malabar Coast"),
    badge: "Weekday dining",
    summary: "Join us Sunday to Thursday and ask the coastal crew about the current chef-selected dining offer.",
    validityLabel: "Available on selected quieter services",
    showOnHomepage: false,
    displayDurationSeconds: 7,
    callToAction: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    terms: "Subject to availability and change. Please ask the team when booking and mention the offer before ordering. Not valid with another promotion.",
    displayOrder: 10,
  });

  await upsertByField("promotion", "slug.current", "christmas-day-bookings-2026", {
    title: "Christmas Day at Malabar Coast",
    slug: {_type: "slug", current: "christmas-day-bookings-2026"},
    status: "active",
    poster: image("christmasDayOffer", "Christmas Day table bookings for 25 December 2026 at Malabar Coast"),
    badge: "Christmas Day · 25 December 2026",
    summary: "Book your Christmas Day table at Malabar Coast in Holytown.",
    validityLabel: "Tables are subject to availability",
    showOnHomepage: true,
    displayDurationSeconds: 7,
    callToAction: {_type: "link", label: "Book a table", href: "/book-a-table", openInNewTab: false},
    terms: "Christmas Day tables are subject to availability and restaurant confirmation.",
    displayOrder: 1,
  });

  const christmasCampaignId = await upsertByField("specialDayCampaign", "slug.current", "christmas", {
    title: "A Malabar Coast Christmas",
    slug: {_type: "slug", current: "christmas"},
    status: "active",
    desktopHero: image("christmasHero", "A Nordic and Indian Christmas night at Malabar Coast"),
    mobileHero: image("christmasHero", "A Nordic and Indian Christmas night at Malabar Coast"),
    logoRibbon: "Christmas at the coast",
    greeting: "God Jul · Merry Christmas · ക്രിസ്മസ് ആശംസകൾ",
    heroHeading: "A table wrapped",
    heroAccent: "in Christmas.",
    heroText: "Nordic winter magic, Indian warmth and the people you love around one table.",
    primaryActionLabel: "Reserve your table",
    soundActionLabel: "Ring the bells",
    scrollLabel: "Follow the starlight",
    storyEyebrow: "Two coasts, one Christmas",
    storyHeading: "From saffron glow to Nordic snow.",
    storyItems: [
      {_type: "object", _key: "star", symbol: "✦", title: "Star lantern", copy: "The warm glow of Kerala paper stars meets the Swedish julstjärna."},
      {_type: "object", _key: "heart", symbol: "♥", title: "Woven heart", copy: "A Scandinavian Christmas heart, coloured with Malabar marigold and saffron."},
      {_type: "object", _key: "dala", symbol: "♞", title: "Dala & diya", copy: "Nordic folk red sits beside the gentle gleam of a traditional brass lamp."},
    ],
    bookingEyebrow: "Your festive gathering",
    bookingHeading: "Save a seat for Christmas.",
    bookingText: "Not quite julbord. Not quite a Kerala feast. Entirely Malabar Coast—prepared with care for family suppers, work parties and winter date nights.",
    occasionLabel: "Christmas gathering",
    confirmationEyebrow: "Christmas is on the calendar",
    formHeading: "Tell us who's coming.",
    confirmationHeading: "Your table is confirmed.",
    promiseTitle: "Made for every guest",
    promiseText: "Tell us about allergies, accessibility needs and little details that help us welcome you well.",
    submitLabel: "Reserve our Christmas table",
    closingEyebrow: "God jul från Malabar Coast",
    closingHeading: "Warm spice. Winter light. A very merry table.",
    closingLink: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    palette: {night: "#061A1D", evergreen: "#174C38", berry: "#931F2E", gold: "#F6C96F", cream: "#F4EAD4", ink: "#102D28"},
    emblemStyle: "winter",
    ambientEffect: "snow",
    enableSound: true,
    seo: {title: "Christmas Table Booking", description: "Reserve a festive Christmas table at Malabar Coast in Holytown.", image: image("christmasHero", "A Nordic and Indian Christmas night at Malabar Coast")},
  });
  await client.createOrReplace({_id: "bookingExperienceSettings", _type: "bookingExperienceSettings", bookingMode: "regular", activeCampaign: {_type: "reference", _ref: christmasCampaignId}, note: "Switch to special when the seasonal booking page should replace /book-a-table."});

  const legalSeeds = [
    {pageKey: "privacy", title: "Privacy Policy", summary: "How Malabar Coast collects, uses, shares and protects personal data under UK data protection law.", body: [block("The complete checked-in privacy policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "privacy-body")]},
    {pageKey: "cookie", title: "Cookie Policy", summary: "How essential storage and optional tracking technologies are used on the website.", body: [block("The complete checked-in cookie policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "cookie-body")]},
    {pageKey: "returns", title: "Returns and Refunds", summary: "Restaurant order cancellation, return and refund information.", body: [block("The complete checked-in returns policy remains the website fallback. Update and legally review the CMS version before publishing substantial policy changes.", "returns-body")]},
    {pageKey: "payments", title: "Payments and Website Terms", summary: "Terms governing online ordering, hosted card payments and use of the website.", body: [block("The complete checked-in payments and website terms remain the website fallback. Add and legally review Page sections before the CMS version is published.", "payments-body")]},
  ];
  for (const legal of legalSeeds) await upsertByField("legalPage", "pageKey", legal.pageKey, {...legal, lastUpdated: "2026-08-17"});

  console.log(JSON.stringify({categories: menuCategories.length, menuItems: menuItems.length, faqItems: faqItems.length, images: assetIds.size, pages: marketingPages.length}));
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : "Sanity seed failed.");
  process.exitCode = 1;
});
