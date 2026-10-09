import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {HomeExperience, type HomeCmsContent} from "./home-experience";
import {getMenuContent} from "@/sanity/lib/menu";
import {getTestimonials} from "@/sanity/lib/testimonials";
import {getActiveDailySpecials} from "@/sanity/lib/daily-specials";
import {getBookingSettings} from "./lib/booking-store";
import type {Metadata} from "next";
import {getSiteSettings} from "@/sanity/lib/site";
import {getRestaurantSchedule} from "./lib/schedule-store";
import {getServiceAvailability} from "./lib/service-availability-store";
import {publicServiceAvailability} from "./lib/service-availability";
import {getActivePromotions} from "@/sanity/lib/promotions";

const fallbackMetadata: Metadata = {
  title: "Malabar Coast UK | Indian Restaurant & Bar in Holytown",
  description: "Malabar Coast serves Indian tandoor dishes, curries, biriyani and coastal specialities in Holytown, Scotland.",
  alternates: {canonical: "/"},
};

export async function generateMetadata() {
  const metadata = await getMarketingPageMetadata("home", "/", fallbackMetadata);
  return {
    ...metadata,
    title: fallbackMetadata.title,
    description: fallbackMetadata.description,
    openGraph: {
      ...metadata.openGraph,
      title: fallbackMetadata.title,
      description: fallbackMetadata.description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [page, {items: menuItems}, testimonials, dailySpecials, promotions, bookingSettings, siteSettings, schedule, serviceAvailability] = await Promise.all([getMarketingPage("home"), getMenuContent(), getTestimonials(), getActiveDailySpecials(), getActivePromotions(), getBookingSettings(), getSiteSettings(), getRestaurantSchedule(), getServiceAvailability()]);
  const overview = getPageSection(page, "home-overview");
  const menu = getPageSection(page, "home-menu");
  const reservations = getPageSection(page, "home-reservations");
  const content: HomeCmsContent = page ? {
    heroEyebrow: page.eyebrow,
    heroHeading: page.heroHeading,
    heroText: page.heroText,
    heroImage: page.heroImage,
    heroPrimaryLink: page.heroPrimaryLink,
    heroSecondaryLink: page.heroSecondaryLink,
    heroTertiaryLink: page.heroTertiaryLink,
    overviewEyebrow: overview?.eyebrow,
    overviewHeading: overview?.heading,
    overviewText: portableTextToPlainText(overview?.body),
    menuEyebrow: menu?.eyebrow,
    menuHeading: menu?.heading,
    menuText: portableTextToPlainText(menu?.body),
    featuredDishes: menu?.featuredDishes,
    reservationEyebrow: reservations?.eyebrow,
    reservationHeading: reservations?.heading,
    reservationText: reservations?.text,
    reservationPrimaryLink: reservations?.primaryLink,
    reservationSecondaryLink: reservations?.secondaryLink,
    mapUrl: siteSettings.mapUrl,
    mapEmbedUrl: siteSettings.mapEmbedUrl,
    coordinates: siteSettings.coordinates,
    establishedDate: siteSettings.establishedDate,
    testimonials,
  } : {};
  return <HomeExperience content={content} menuItems={menuItems} dailySpecials={dailySpecials} promotions={promotions} bookingSettings={bookingSettings} schedule={schedule} tableAvailability={publicServiceAvailability(serviceAvailability).table} />;
}
