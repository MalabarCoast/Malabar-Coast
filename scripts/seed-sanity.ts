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
  logo: "malabar af.svg",
  lightLogo: "logo-white.png",
  hero: "malabar-restaurant-hero-v2.jpg",
  hallOne: "Hall1.jpeg",
  hallTwo: "Hall2.jpeg",
  hallThree: "Hall3.jpeg",
  diningRoom: "restaurant/dining-room.png",
  tableForTwo: "restaurant/table-for-two.png",
  archedPassage: "restaurant/arched-passage.png",
  storyPort: "story/calicut-spice-port.png",
  storyPepper: "story/pepper-balance.png",
  storyGhats: "story/western-ghats.png",
  calicutPrawns: "menu/calicut-pepper-prawns.png",
  malindiFish: "menu/malindi-sea-bass.png",
  mozambiqueShellfish: "menu/mozambique-lobster.png",
  capeLamb: "menu/cape-malay-lamb.png",
  lisbonDessert: "menu/lisbon-custard-tart.png",
  scotlandFish: "menu/scotland-haddock.png",
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

const pageSeeds = () => [
  {
    pageKey: "home",
    title: "Home",
    eyebrow: "Southern Indian coastal kitchen · Holytown",
    heroHeading: "From the Malabar Coast to Scotland.",
    heroText: "Kerala's pepper, coconut, curry leaf and hospitality, served at 33 Main Street in Holytown.",
    heroImage: image("hero", "A Kerala-inspired restaurant table with coastal dishes in a warm dining room"),
    heroPrimaryLink: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    heroSecondaryLink: {_type: "link", label: "Book your table", href: "/book-a-table", openInNewTab: false},
    sections: [
      {_type: "contentSection", _key: "home-overview", internalName: "What is Malabar Coast?", eyebrow: "Our restaurant", heading: "What is Malabar Coast?", body: malabarCoastIntroduction.map((paragraph,index)=>block(paragraph, `overview-copy-${index+1}`)), image: image("diningRoom", "The warmly lit Malabar Coast dining room")},
      {_type: "contentSection", _key: "home-menu", internalName: "Signature menu", eyebrow: "From our kitchen", heading: "Come to the table.", body: [block("Pepper warmed over fire, coconut softened with lime and dishes prepared for sharing.", "menu-copy")], image: image("calicutPrawns", "A coastal prawn dish with curry leaf")},
      {_type: "contentSection", _key: "home-story", internalName: "Coastal story", eyebrow: "Our story", heading: "A coast that changed the table.", body: [block("Follow the old sea road from Calicut to the new coast in Scotland.", "story-copy")], image: image("storyPort", "A rain-washed historic spice port on the Malabar Coast")},
      {_type: "callToAction", _key: "home-reservations", eyebrow: "Book your table", heading: "Your table by the coast.", text: "Choose your date, arrival time and party size online, with live capacity checked before confirmation.", primaryLink: {_type: "link", label: "Book your table", href: "/book-a-table", openInNewTab: false}, secondaryLink: {_type: "link", label: "Get directions", href: site.maps.directionsUrl, openInNewTab: true}, image: image("tableForTwo", "An intimate table for two at Malabar Coast")},
    ],
    seo: {title: "Malabar Coast | Southern Indian Restaurant in Holytown", description: "Southern Indian coastal cooking from Malabar to Scotland."},
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
      {_type: "callToAction", _key: "restaurant-hall", eyebrow: "Private gatherings", heading: "A room of your own.", text: "A flexible private hall with a built-in bar, raised stage and open floor.", primaryLink: {_type: "link", label: "Explore the private hall", href: "/hall", openInNewTab: false}, image: image("hallThree", "The private hall with stage and flexible seating")},
    ],
    seo: {title: "Restaurant in Holytown", description: "Coastal South Indian cooking and warm hospitality at Malabar Coast in Holytown."},
  },
  {
    pageKey: "hall",
    title: "Private hall",
    eyebrow: "Private gatherings · Holytown",
    heroHeading: "A room of your own.",
    heroText: "A flexible event space within the restaurant with a built-in wooden bar, raised stage and open floor.",
    heroImage: image("hallOne", "The private hall at Malabar Coast with an open floor and built-in wooden bar"),
    heroPrimaryLink: {_type: "link", label: "Start your enquiry", href: "#hall-enquiry", openInNewTab: false},
    heroSecondaryLink: {_type: "link", label: "Book a restaurant table", href: "/book-a-table", openInNewTab: false},
    sections: [
      {_type: "contentSection", _key: "hall-intro", internalName: "Gather by the coast", eyebrow: "The private hall", heading: "Gather by the coast.", body: [block("The room can move from an open reception to seated arrangements without losing its warm, understated character. Capacity, packages, catering choices and pricing remain subject to restaurant confirmation.", "hall-copy")], image: image("hallOne", "Open floor and built-in bar in the private hall"), items: [
        {_type: "object", _key: "dedicated", shortLabel: "01", title: "Dedicated space", text: "A private room within the restaurant"},
        {_type: "object", _key: "bar", shortLabel: "02", title: "At one end", text: "A built-in wooden bar"},
        {_type: "object", _key: "stage", shortLabel: "03", title: "At the other", text: "A raised event stage"},
        {_type: "object", _key: "floor", shortLabel: "04", title: "Through the room", text: "A flexible open floor"},
      ]},
      {_type: "contentSection", _key: "hall-stage", internalName: "The stage", eyebrow: "A natural focal point", heading: "A natural focal point.", body: [block("The raised stage anchors the far end of the room for speeches, presentations and moments shared together.", "stage-copy")], image: image("hallTwo", "Wide view of the event hall showing its open floor and raised stage")},
      {_type: "contentSection", _key: "hall-gallery", internalName: "Set the scene", eyebrow: "The room", heading: "Set the scene.", image: image("hallThree", "The raised stage with chairs arranged across the hall floor")},
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
    heroImage: image("storyPort", "A rain-washed historic spice port on the Malabar Coast"),
    sections: [
      {_type: "contentSection", _key: "story-inspiration", internalName: "Our Inspiration", eyebrow: ourInspirationContent.title, heading: ourInspirationContent.subtitle, body: ourInspirationContent.paragraphs.map((paragraph,index)=>block(paragraph, `inspiration-copy-${index+1}`))},
      {_type: "contentSection", _key: "story-pepper", internalName: "Pepper", eyebrow: "Chapter I", heading: "The pepper coast", body: [block("For over 3,000 years, travellers came for black pepper, cardamom, cinnamon and cloves.", "pepper-copy")], image: image("storyPepper", "Black pepper and coastal ingredients")},
      {_type: "contentSection", _key: "story-monsoon", internalName: "Monsoon", eyebrow: "Chapter II", heading: "The monsoon road", body: [block("Seasonal winds connected the Malabar Coast with distant ports across the Indian Ocean.", "monsoon-copy")], image: image("storyGhats", "The green Western Ghats in monsoon weather")},
      {_type: "callToAction", _key: "story-table", eyebrow: "The story made edible", heading: "History, served warm.", text: "The old sea road is still present in the pepper, coconut and cardamom cooked with every day.", primaryLink: {_type: "link", label: "View the menu", href: "/menu", openInNewTab: false}, image: image("scotlandFish", "Fish in a golden coastal curry")},
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
      allergens: [],
      allergenNotes: "The supplied menu did not include a confirmed allergen matrix. Restaurant confirmation is required before publishing allergens.",
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
    ["malabar-coast-signature-masala-grilled-fish", "Kannur", "North Kerala coast", "11.8745° N · 75.3704° E", "Fire and coast", "Chargrilled fish", "malindiFish", "Masala grilled fish representing the fire-led cooking of Kannur", "Kannur's northern shoreline brings together fresh fish, warm spice and fire-led cooking with the confidence of North Malabar."],
    ["malabar-coast-signature-konju-coconut-fry", "Kozhikode", "North Malabar", "11.2588° N · 75.7804° E", "Coconut and coast", "Coastal fry", "calicutPrawns", "Prawns cooked with coconut and curry leaves in the style of Kozhikode", "Prawns, coconut and curry leaves carry the bold savoury character of Kozhikode and Kerala's Arabian Sea shore."],
    ["desserts-malabar-coast-special-dessert", "Palakkad", "The Kerala gap", "10.7867° N · 76.6548° E", "Rice and harvest", "Festive sweet", "lisbonDessert", "A warm spiced dessert representing Kerala's festive table", "Palakkad's harvest landscape inspires a gentle, spice-warmed finish rooted in Kerala's traditions of rice, milk and celebration."],
    ["malabar-coast-signature-prawn-moilee", "Kochi", "Central Kerala coast", "9.9312° N · 76.2673° E", "Harbour kitchen", "Coconut curry", "mozambiqueShellfish", "Prawns in a golden coconut moilee with curry leaves", "A harbour-side style of mild coconut curry, bright with ginger, green chilli and curry leaf around tender prawns."],
    ["malabar-coast-signature-aattirachi-kurumulak", "Kottayam", "Central Travancore", "9.5916° N · 76.5222° E", "Pepper country", "Pepper-spiced lamb", "capeLamb", "Pepper-spiced lamb representing the kitchens of Kottayam", "Black pepper, shallots and curry leaves echo the robust Syrian-Christian kitchens of Kottayam and central Travancore."],
    ["malabar-coast-signature-meen-moilee", "Alappuzha", "Backwater coast", "9.4981° N · 76.3388° E", "Backwater kitchen", "Golden fish curry", "scotlandFish", "Fish in a golden coconut moilee representing Alappuzha's backwaters", "Alappuzha's backwater cooking meets tender fish, coconut milk, ginger and curry leaf in a gentle golden moilee."],
  ] as const;
  await client.createOrReplace({
    _id: "menuPage",
    _type: "menuPage",
    eyebrow: "A taste of Kerala · North to South",
    headingLineOne: "Six regions.",
    headingLineTwo: "One Kerala.",
    introduction: "Travel through six Kerala food landscapes, from North Malabar's fire and coconut to the backwater curries of Alappuzha.",
    journeyLinkLabel: "Explore Kerala",
    manifestEyebrow: "The full menu",
    manifestHeading: "What we carry to the table.",
    manifestIntroduction: "The current Malabar Coast menu, prepared for sharing and available to order online where shown.",
    dietaryNotice: "Dietary labels are based on the supplied menu names and still require confirmation from the restaurant. Please tell the team about allergies before ordering; the kitchen handles all 14 regulated allergens and cross-contact may occur.",
    alcoholNotice: "Alcoholic-drink prices are not published online. Please ask the restaurant team for the current bar price list. Alcohol is not available through online ordering.",
    voyageStops: voyageSeeds.map(([itemId, area, region, coordinates, yearLabel, courseLabel, imageKey, alt, description], index) => ({
      _type: "object", _key: `voyage-${index + 1}`, dish: {_type: "reference", _ref: itemIds.get(itemId)!}, area, region, coordinates, yearLabel, courseLabel, image: image(imageKey, alt), description,
    })),
    seo: {title: "South Indian Menu", description: "The current Malabar Coast menu with food prices, ordering availability and carefully reviewed dietary status."},
  });

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    restaurantName: "Malabar Coast",
    legalName: "Malabar Coast",
    shortDescription: "Southern Indian coastal cooking from Malabar to Scotland.",
    description: "Malabar Coast is a Southern Indian coastal restaurant in Holytown, Scotland, serving Kerala-inspired seafood, curries, biriyani and vegetarian dishes.",
    logo: image("logo", "Malabar Coast logo"),
    lightLogo: image("lightLogo", "Malabar Coast white logo"),
    siteUrl: "https://malabarcoast.co.uk",
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
    socialLinks: [{_key: "instagram", platform: "Instagram", url: "https://www.instagram.com/malabarcoastuk"}],
    primaryNavigation: [
      {_type: "link", _key: "story", label: "Our story", href: "/story", openInNewTab: false},
      {_type: "link", _key: "menu", label: "The menu", href: "/menu", openInNewTab: false},
      {_type: "link", _key: "offers", label: "Offers & specials", href: "/offers", openInNewTab: false},
      {_type: "link", _key: "book", label: "Book a table", href: "/book-a-table", openInNewTab: false},
      {_type: "link", _key: "restaurant", label: "Our restaurant", href: "/restaurant", openInNewTab: false},
      {_type: "link", _key: "hall", label: "Private hall", href: "/hall", openInNewTab: false},
      {_type: "link", _key: "faq", label: "Good to know", href: "/faq", openInNewTab: false},
      {_type: "link", _key: "order", label: "Your order", href: "/checkout", openInNewTab: false},
    ],
    footerNavigation: [
      {_type: "link", _key: "payments", label: "Payments", href: "/payments", openInNewTab: false},
      {_type: "link", _key: "returns", label: "Returns", href: "/returns", openInNewTab: false},
      {_type: "link", _key: "cookie", label: "Cookie", href: "/cookie", openInNewTab: false},
      {_type: "link", _key: "privacy", label: "Privacy", href: "/privacy", openInNewTab: false},
    ],
    copyrightText: "© Malabar Coast 2026. All rights reserved.",
    defaultSeo: {title: "Malabar Coast | Southern Indian Restaurant in Holytown", description: "Southern Indian coastal cooking from Malabar to Scotland.", image: image("hero", "A Kerala-inspired restaurant table")},
  });

  const marketingPages = pageSeeds();
  for (const page of marketingPages) await upsertByField("marketingPage", "pageKey", page.pageKey, page);
  for (const [index, faq] of faqItems.entries()) await upsertByField("faqItem", "question", faq.question, {question: faq.question, answer: faq.answer, category: ["private-hall", "hall-facilities", "hall-enquiries"].includes(faq.id) ? "Private hall" : "Restaurant", displayOrder: index, published: true});

  const testimonials = [
    {name: "Just Eat guests", source: "Independent delivery platform", rating: 4.75, quote: "Eight early diners placed Malabar Coast at 4.75 out of 5, a warm first word from Holytown."},
    {name: "Uber Eats guests", source: "Independent delivery platform", rating: 5, quote: "The first two ratings arrived as a perfect 5.0 out of 5, carrying the earliest taste of the kitchen beyond our doors."},
  ];
  for (const [index, testimonial] of testimonials.entries()) await upsertByField("testimonial", "name", testimonial.name, {...testimonial, displayOrder: index, published: true});

  const specialMenuItem = menuItems.find((item) => item.id === "malabar-coast-signature-konju-coconut-fry");
  const specialMenuItemId = itemIds.get("malabar-coast-signature-konju-coconut-fry");
  if (specialMenuItem && specialMenuItemId && specialMenuItem.pricePence != null) {
    await upsertByField("dailySpecial", "slug.current", "coastal-kitchen-pick", {
      title: specialMenuItem.name,
      slug: {_type: "slug", current: "coastal-kitchen-pick"},
      status: "active",
      image: image("calicutPrawns", "A coastal prawn dish with curry leaf and charred lime"),
      badge: "Today from the kitchen",
      description: specialMenuItem.description || "A bright coastal plate of pepper, coconut and curry leaf.",
      pricePence: specialMenuItem.pricePence,
      priceNote: "While today's batch lasts",
      dietaryNote: "Please tell the team about allergies before ordering.",
      menuItem: {_type: "reference", _ref: specialMenuItemId},
      activeDays: ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      displayOrder: 10,
    });
  }

  await upsertByField("promotion", "slug.current", "next-offer-template", {
    title: "Your next Malabar Coast offer",
    slug: {_type: "slug", current: "next-offer-template"},
    status: "paused",
    poster: image("hero", "Malabar Coast dining table used as a placeholder offer poster"),
    badge: "Offer template",
    summary: "Replace this poster and copy, choose the live dates, then switch the status to Active.",
    validityLabel: "Paused until the team publishes it",
    showOnHomepage: false,
    callToAction: {_type: "link", label: "Explore the menu", href: "/menu", openInNewTab: false},
    terms: "Add the confirmed offer conditions before publishing.",
    displayOrder: 100,
  });

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
