import {defineQuery} from "next-sanity";
import {getSanityClient} from "./client";

export type AdminMenuRecord = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  categorySlug?: string;
  pricePence?: number | null;
  available: boolean;
  onlineOrdering: boolean;
  featured: boolean;
  isAlcoholic: boolean;
  updatedAt: string;
};

export type AdminPromotionRecord = {
  _id: string;
  title: string;
  status: "active" | "paused";
  showOnHomepage: boolean;
  startsAt?: string;
  endsAt?: string;
  updatedAt: string;
  poster?: {url?: string; alt?: string};
};

export type AdminDailySpecialRecord = {
  _id: string;
  title: string;
  status: "active" | "soldOut" | "paused";
  pricePence?: number;
  updatedAt: string;
  image?: {url?: string; alt?: string};
  menuItemId?: string;
};

type AdminDailySpecialQueryRecord = Omit<AdminDailySpecialRecord, "title" | "pricePence" | "image"> & {
  titleOverride?: string;
  legacyTitle?: string;
  priceOverridePence?: number;
  legacyPricePence?: number;
  imageOverride?: AdminDailySpecialRecord["image"];
  legacyImage?: AdminDailySpecialRecord["image"];
  menuItem?: {id?: string; name?: string; pricePence?: number; image?: AdminDailySpecialRecord["image"]};
};

export type AdminPageRecord = {
  _id: string;
  _type: "marketingPage" | "legalPage";
  title: string;
  pageKey: string;
  updatedAt: string;
};

export type AdminSpecialDayRecord = {
  _id: string;
  title: string;
  slug: string;
  status: "active" | "paused";
  updatedAt: string;
  desktopHero?: {url?: string; alt?: string};
};

export type AdminContentOverview = {
  menuItems: AdminMenuRecord[];
  promotions: AdminPromotionRecord[];
  dailySpecials: AdminDailySpecialRecord[];
  specialDays: AdminSpecialDayRecord[];
  bookingExperience?: {bookingMode: "regular" | "special"; activeCampaign?: {_id: string; title: string; slug: string}};
  pages: AdminPageRecord[];
  categoryCount: number;
  faqCount: number;
  testimonialCount: number;
  hasMenuPage: boolean;
  hasSiteSettings: boolean;
};

export const adminContentOverviewQuery = defineQuery(`{
  "menuItems": *[_type == "menuItem"] | order(category->orderRank asc, displayOrder asc, name asc) {
    _id,
    name,
    description,
    "category": category->title,
    "categorySlug": category->slug.current,
    pricePence,
    "available": coalesce(available, true),
    "onlineOrdering": coalesce(onlineOrdering, true),
    "featured": coalesce(featured, false),
    "isAlcoholic": coalesce(isAlcoholic, false),
    "updatedAt": _updatedAt
  },
  "promotions": *[_type == "promotion"] | order(displayOrder asc, _updatedAt desc) {
    _id,
    title,
    "status": coalesce(status, "paused"),
    "showOnHomepage": coalesce(showOnHomepage, false),
    startsAt,
    endsAt,
    "updatedAt": _updatedAt,
    poster {alt, "url": asset->url}
  },
  "dailySpecials": *[_type == "dailySpecial"] | order(displayOrder asc, _updatedAt desc) {
    _id,
    "status": coalesce(status, "paused"),
    titleOverride,
    "legacyTitle": title,
    priceOverridePence,
    "legacyPricePence": pricePence,
    "updatedAt": _updatedAt,
    imageOverride {alt, "url": asset->url},
    "legacyImage": image {alt, "url": asset->url},
    menuItem->{"id": _id, name, pricePence, image {alt, "url": asset->url}}
  },
  "specialDays": *[_type == "specialDayCampaign"] | order(_updatedAt desc) {
    _id,
    title,
    "slug": slug.current,
    "status": coalesce(status, "paused"),
    "updatedAt": _updatedAt,
    desktopHero {alt, "url": asset->url}
  },
  "bookingExperience": *[_id == "bookingExperienceSettings"][0] {
    "bookingMode": coalesce(bookingMode, "regular"),
    activeCampaign->{_id, title, "slug": slug.current}
  },
  "pages": *[_type in ["marketingPage", "legalPage"]] | order(_type asc, pageKey asc) {
    _id,
    _type,
    title,
    pageKey,
    "updatedAt": _updatedAt
  },
  "categoryCount": count(*[_type == "menuCategory"]),
  "faqCount": count(*[_type == "faqItem"]),
  "testimonialCount": count(*[_type == "testimonial"]),
  "hasMenuPage": defined(*[_id == "menuPage"][0]._id),
  "hasSiteSettings": defined(*[_id == "siteSettings"][0]._id)
}`);

export async function getAdminContentOverview(): Promise<AdminContentOverview | null> {
  const client = getSanityClient();
  if (!client) return null;

  try {
    const overview = await client.fetch(adminContentOverviewQuery, {}, {cache: "no-store"}) as Omit<AdminContentOverview, "dailySpecials"> & {dailySpecials: AdminDailySpecialQueryRecord[]};
    return {
      ...overview,
      dailySpecials: overview.dailySpecials.map((special) => ({
        _id: special._id,
        title: special.titleOverride?.trim() || special.menuItem?.name?.trim() || special.legacyTitle?.trim() || "Untitled special",
        status: special.status,
        pricePence: special.priceOverridePence ?? special.menuItem?.pricePence ?? special.legacyPricePence,
        updatedAt: special.updatedAt,
        image: special.imageOverride?.url ? special.imageOverride : special.menuItem?.image?.url ? special.menuItem.image : special.legacyImage,
        menuItemId: special.menuItem?.id,
      })),
    };
  } catch (error) {
    console.error("Sanity admin content overview could not be loaded.", error instanceof Error ? error.name : "UnknownError");
    return null;
  }
}
