import {getMenuItem, menuCategories, menuItems, type DietaryStatus, type MenuCategory, type MenuItem} from "@/app/lib/menu";
import {getSanityClient} from "./client";
import {checkoutMenuItemQuery, menuContentQuery} from "./queries";

export type CmsImage = {url: string; alt: string; dimensions?: {width: number; height: number; aspectRatio: number}};

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
  eyebrow: "A taste of India · Coast to mountains",
  headingLineOne: "Six places.",
  headingLineTwo: "One table.",
  introduction: "Travel from Delhi and Amritsar's tandoor fire to Mumbai's grills, Kashmir's aromatic lamb, Hyderabad's biriyani and Lucknow's festive sweets.",
  journeyLinkLabel: "Explore India",
  manifestEyebrow: "The full menu",
  manifestHeading: "What we carry to the table.",
  manifestIntroduction: "The current Malabar Coast menu, prepared for sharing and available to order online where shown.",
  dietaryNotice: "Dietary labels are based on the supplied menu names and still require confirmation from the restaurant. Please tell the team about allergies before ordering; the kitchen handles all 14 regulated allergens and cross-contact may occur.",
  alcoholNotice: "Alcoholic-drink prices are not published online. Please ask the restaurant team for the current bar price list. Alcohol is not available through online ordering.",
  voyageStops: [
    {itemId: "clay-oven-chicken-tikka", area: "Delhi", region: "North India", coordinates: "28.6139° N · 77.2090° E", year: "Capital tandoor", course: "Chicken tikka", image: {url: "/menu/chicken-tikka.png", alt: "Charred chicken tikka inspired by Delhi's tandoor kitchens"}, description: "Tender yoghurt-spiced chicken, charred in the tandoor for smoky edges and a juicy centre."},
    {itemId: "clay-oven-tandoori-chicken", area: "Amritsar", region: "Punjab", coordinates: "31.6340° N · 74.8723° E", year: "Punjab fire", course: "Tandoori chicken", image: {url: "/menu/tandoori-chicken.png", alt: "Bone-in tandoori chicken inspired by Amritsar"}, description: "Bone-in chicken marinated with yoghurt and warm spices, then roasted over fierce tandoor heat."},
    {itemId: "clay-oven-chicken-shashlik", area: "Mumbai (Bombay)", region: "Western India", coordinates: "19.0760° N · 72.8777° E", year: "City grill", course: "Chicken shashlik", image: {url: "/menu/chicken-shashlik.png", alt: "Chicken shashlik with peppers and onion inspired by Mumbai"}, description: "Tandoor-grilled chicken, peppers and onion layered on skewers with a bright, smoky finish."},
    {itemId: "clay-oven-lamb-tikka", area: "Kashmir", region: "Himalayan north", coordinates: "34.0837° N · 74.7973° E", year: "Mountain spice", course: "Lamb tikka", image: {url: "/menu/lamb-tikka.png", alt: "Aromatic lamb tikka inspired by Kashmir"}, description: "Boneless lamb steeped in aromatic spices and cooked in the tandoor until tender and lightly charred."},
    {itemId: "biriyani-chicken", area: "Hyderabad", region: "Deccan", coordinates: "17.3850° N · 78.4867° E", year: "Dum kitchen", course: "Chicken biriyani", image: {url: "/menu/chicken-biriyani.png", alt: "Fragrant chicken biriyani inspired by Hyderabad"}, description: "Fragrant basmati rice layered with spiced chicken and slow-cooked together in the dum style."},
    {itemId: "desserts-gulab-jamun", area: "Lucknow", region: "Awadh", coordinates: "26.8467° N · 80.9462° E", year: "Festive finish", course: "Gulab jamun", image: {url: "/menu/gulab-jamun.png", alt: "Gulab jamun in cardamom and saffron syrup"}, description: "Soft golden milk dumplings soaked in fragrant cardamom and saffron syrup."},
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
  const dietaryStatus: DietaryStatus = isAlcoholic
    ? "notApplicable"
    : raw.isVegan
      ? "vegan"
      : raw.isVegetarian
        ? "vegetarian"
        : raw.dietaryStatus ?? fallback?.dietaryStatus ?? "nonVegetarian";
  const pricePence = isAlcoholic ? null : typeof raw.pricePence === "number" ? raw.pricePence : raw.pricePence === null ? null : fallback?.pricePence ?? null;
  return {
    id: raw.id,
    category: raw.category,
    name: raw.name,
    description: raw.description?.trim() || fallback?.description || "",
    subheading: raw.subheading ?? fallback?.subheading,
    pricePence,
    priceLabel: isAlcoholic ? "Ask the coast crew" : raw.priceLabel ?? fallback?.priceLabel,
    hidePrice: isAlcoholic || (raw.hidePrice ?? fallback?.hidePrice ?? false),
    isAlcoholic,
    dietaryStatus,
    dietaryReviewStatus: raw.dietaryReviewStatus ?? fallback?.dietaryReviewStatus ?? "needs-review",
    dietary: dietaryStatus === "vegan" ? ["VG"] : dietaryStatus === "vegetarian" ? ["V"] : [],
    allergens: Array.isArray(raw.allergens) ? raw.allergens : fallback?.allergens ?? [],
    spice: ((raw.spiceLevel || raw.spice || fallback?.spice || "None").replace(/^./, (character) => character.toUpperCase())) as MenuItem["spice"],
    available: raw.available ?? fallback?.available ?? true,
    onlineOrdering: !isAlcoholic && pricePence !== null && (raw.onlineOrdering ?? fallback?.onlineOrdering ?? true),
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
    const cmsItems = (result.items ?? []).map(normaliseItem).filter((entry): entry is MenuItem => Boolean(entry));
    const items = cmsItems.length ? cmsItems : menuItems;
    const page = {
      ...fallbackMenuPage,
      ...(result.page ?? {}),
      eyebrow: fallbackMenuPage.eyebrow,
      headingLineOne: fallbackMenuPage.headingLineOne,
      headingLineTwo: fallbackMenuPage.headingLineTwo,
      introduction: fallbackMenuPage.introduction,
      journeyLinkLabel: fallbackMenuPage.journeyLinkLabel,
      voyageStops: fallbackMenuPage.voyageStops,
    };
    return {categories, items, page, source: "sanity" as const};
  } catch (error) {
    console.error("Sanity menu fetch failed; using the checked-in menu fallback.", error instanceof Error ? error.name : "UnknownError");
    return {categories: menuCategories, items: menuItems, page: fallbackMenuPage, source: "fallback" as const};
  }
}

export async function getCheckoutMenuItem(id: string) {
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
