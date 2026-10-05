import {drinkCategorySlugs, drinkPriceLabel, formatMenuItemName, getMenuItem, menuCategories, menuItems, type DietaryStatus, type MenuCategory, type MenuItem} from "@/app/lib/menu";
import {getSanityClient} from "./client";
import {checkoutMenuItemQuery, menuContentQuery} from "./queries";

export type CmsImage = {url: string; alt: string; caption?: string; dimensions?: {width: number; height: number; aspectRatio: number}};

export type MenuVoyageStop = {
  _key?: string;
  itemId: string;
  area: string;
  region: string;
  coordinates: string;
  year: string;
  course: string;
  image: CmsImage | {url: string; alt: string};
  description: string;
};

export type MenuPageContent = {
  eyebrow: string;
  headingLineOne: string;
  headingLineTwo: string;
  introduction: string;
  journeyLinkLabel: string;
  manifestEyebrow: string;
  manifestHeading: string;
  manifestIntroduction: string;
  dietaryNotice: string;
  alcoholNotice: string;
  voyageStops: MenuVoyageStop[];
  seo?: {title?: string; description?: string; noIndex?: boolean; image?: {url: string; alt?: string}};
};

const fallbackMenuPage: MenuPageContent = {
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
  seo: {
    title: "Indian Cuisine & Bar Menu in Holytown",
    description: "Explore tandoori chicken, chicken tikka, biriyani, curries, vegetarian dishes, Malabar coastal specialities and desserts at Malabar Coast.",
  },
  voyageStops: [
    {itemId: "malabar-coast-signature-meen-moilee", area: "Kochi", region: "Kerala", coordinates: "9.9312° N · 76.2673° E", year: "Arabian Sea harbour", course: "Meen Moilee", image: {url: "/food/Meen Moilee.jpeg", alt: "Meen Moilee served at Malabar Coast"}, description: "A gentle fish and coconut curry that keeps Kerala's coastal cooking at the heart of the journey."},
    {itemId: "malabar-coast-signature-aattirachi-kurumulak", area: "Kozhikode", region: "Kerala", coordinates: "11.2588° N · 75.7804° E", year: "Historic spice port", course: "Aattirachi Kurumulak", image: {url: "/food/aatirachi kurumulak ittath.jpeg", alt: "Aattirachi Kurumulak served at Malabar Coast"}, description: "Pepper-led lamb recalls the spice trade that made Kozhikode one of the coast's great meeting places."},
    {itemId: "malabar-coast-signature-masala-grilled-fish", area: "Mangaluru", region: "Karnataka coast", coordinates: "12.9141° N · 74.8560° E", year: "Western coast", course: "Masala Grilled Fish", image: {url: "/food/Masala grill fish.jpeg", alt: "Masala grilled fish served at Malabar Coast"}, description: "Masala-coated grilled fish carries the bright heat and sea-facing character of India's western coast."},
    {itemId: "chicken-chicken-chasni", area: "Mumbai", region: "Maharashtra", coordinates: "19.0760° N · 72.8777° E", year: "Gateway harbour", course: "Chicken Chasni", image: {url: "/food/chicken-chasni.png", alt: "Creamy chicken chasni served at Malabar Coast"}, description: "A creamy, gently sweet-and-tangy chicken curry for a city whose tables bring regional flavours together."},
    {itemId: "breads-peshwari-naan", area: "Surat", region: "Gujarat", coordinates: "21.1702° N · 72.8311° E", year: "Gulf of Khambhat", course: "Peshwari Naan", image: {url: "/food/Peshwari naan.jpeg", alt: "Peshwari naan served at Malabar Coast"}, description: "A fragrant, fruit-and-nut-filled naan marks Gujarat on the west-coast route with a sweet counterpoint."},
    {itemId: "dosa-masala-dosa", area: "Chennai", region: "Tamil Nadu", coordinates: "13.0827° N · 80.2707° E", year: "Coromandel coast", course: "Dosa", image: {url: "/food/Chennai masala dosa.jpeg", alt: "Chennai-style masala dosa served with sambar and chutneys"}, description: "A crisp masala dosa brings Tamil Nadu’s griddle tradition to the final stop on the Coromandel Coast."},
  ],
};

type RawMenuItem = Partial<MenuItem> & {
  id?: string;
  category?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
};

function normaliseItem(raw: RawMenuItem): MenuItem | null {
  if (!raw.id || !raw.category || !raw.name) return null;
  const fallback = getMenuItem(raw.id);
  const isAlcoholic = raw.isAlcoholic ?? fallback?.isAlcoholic ?? false;
  const isDrink = drinkCategorySlugs.has(raw.category);
  const dietaryStatus: DietaryStatus = isAlcoholic
    ? "notApplicable"
    : raw.isVegan
      ? "vegan"
      : raw.isVegetarian
        ? "vegetarian"
        : raw.dietaryStatus ?? fallback?.dietaryStatus ?? "nonVegetarian";
  const pricePence = isAlcoholic ? null : typeof raw.pricePence === "number" ? raw.pricePence : raw.pricePence === null ? null : fallback?.pricePence ?? null;
  const allergens = Array.isArray(raw.allergens) ? raw.allergens : fallback?.allergens ?? [];
  const allergenReviewStatus = raw.allergenReviewStatus
    ?? (raw.dietaryReviewStatus === "confirmed" && allergens.length ? "confirmed" : fallback?.allergenReviewStatus)
    ?? "needs-review";
  return {
    id: raw.id,
    category: raw.category,
    name: formatMenuItemName(raw.name, {category: raw.category, menuItemId: raw.id}),
    description: raw.description?.trim() || fallback?.description || "",
    subheading: raw.subheading ?? fallback?.subheading,
    pricePence,
    priceLabel: isDrink ? drinkPriceLabel : raw.priceLabel ?? fallback?.priceLabel,
    hidePrice: isDrink || (raw.hidePrice ?? fallback?.hidePrice ?? false),
    isAlcoholic,
    dietaryStatus,
    dietaryReviewStatus: raw.dietaryReviewStatus ?? fallback?.dietaryReviewStatus ?? "needs-review",
    dietary: dietaryStatus === "vegan" ? ["VG"] : dietaryStatus === "vegetarian" ? ["V"] : [],
    allergens,
    allergenReviewStatus,
    allergenNotes: raw.allergenNotes ?? fallback?.allergenNotes,
    spice: ((raw.spiceLevel || raw.spice || fallback?.spice || "None").replace(/^./, (character) => character.toUpperCase())) as MenuItem["spice"],
    available: raw.available ?? fallback?.available ?? true,
    onlineOrdering: !isDrink && !isAlcoholic && pricePence !== null && (raw.onlineOrdering ?? fallback?.onlineOrdering ?? true),
    featured: raw.featured ?? fallback?.featured ?? false,
    displayOrder: raw.displayOrder ?? fallback?.displayOrder ?? 0,
  };
}

export async function getMenuContent() {
  const client = getSanityClient();
  if (!client) return {categories: menuCategories, items: menuItems, page: fallbackMenuPage, source: "fallback" as const};

  try {
    const result = await client.fetch(menuContentQuery, {}, {next: {revalidate: 60, tags: ["sanity-menu"]}}) as {
      categories?: Array<Partial<MenuCategory>>;
      items?: RawMenuItem[];
      page?: Partial<MenuPageContent>;
    };
    const cmsCategories = (result.categories ?? []).filter((category): category is MenuCategory => Boolean(category.slug && category.title));
    const categories = cmsCategories.length ? cmsCategories.map((category, index) => ({
      slug: category.slug,
      title: category.title,
      note: category.note || category.title,
      description: category.description || "",
      orderRank: category.orderRank ?? index,
      number: menuCategories[index]?.number || String(index + 1),
    })) : menuCategories;
    const cmsItems = (result.items ?? []).map(normaliseItem).filter((entry): entry is MenuItem => entry !== null && entry.id !== "chicken-indian-garlic-chilli-chicken");
    const items = cmsItems.length ? cmsItems : menuItems;
    const cmsPage = result.page ?? {};
    const cmsCopy = [cmsPage.eyebrow, cmsPage.headingLineOne, cmsPage.headingLineTwo, cmsPage.introduction, cmsPage.journeyLinkLabel].filter(Boolean).join(" ").toLocaleLowerCase("en-GB");
    const legacyKeralaJourney = /one kerala|explore kerala|six kerala|six regions/.test(cmsCopy);
    const page = legacyKeralaJourney
      ? {...fallbackMenuPage, seo: {...cmsPage.seo, ...fallbackMenuPage.seo}}
      : {...fallbackMenuPage, ...cmsPage};
    const voyageStops = (page.voyageStops || fallbackMenuPage.voyageStops).map((stop) => stop.itemId === "chicken-indian-garlic-chilli-chicken"
      ? fallbackMenuPage.voyageStops.find((fallback) => fallback.itemId === "chicken-chicken-chasni")!
      : stop);
    return {categories, items, page: {...page, voyageStops}, source: "sanity" as const};
  } catch (error) {
    console.error("Sanity menu fetch failed; using the checked-in menu fallback.", error instanceof Error ? error.name : "UnknownError");
    return {categories: menuCategories, items: menuItems, page: fallbackMenuPage, source: "fallback" as const};
  }
}

export async function getCheckoutMenuItem(id: string) {
  if (id === "chicken-indian-garlic-chilli-chicken") return undefined;
  const fallback = getMenuItem(id);
  const client = getSanityClient();
  if (!client) return fallback;

  try {
    const raw = await client.fetch(checkoutMenuItemQuery, {id}, {cache: "no-store"}) as RawMenuItem | null;
    if (!raw) return undefined;
    return normaliseItem({...fallback, ...raw});
  } catch (error) {
    console.error("Sanity checkout catalogue fetch failed; using the checked-in price fallback.", error instanceof Error ? error.name : "UnknownError");
    return fallback;
  }
}

export {fallbackMenuPage};
