import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {HomeExperience, type HomeCmsContent} from "./home-experience";
import {getMenuContent} from "@/sanity/lib/menu";
import {getTestimonials} from "@/sanity/lib/testimonials";
import {getActivePromotions} from "@/sanity/lib/promotions";
import {getActiveDailySpecials} from "@/sanity/lib/daily-specials";
import {getBookingSettings} from "./lib/booking-store";
import type {Metadata} from "next";
import {getSiteSettings} from "@/sanity/lib/site";
import {getRestaurantSchedule} from "./lib/schedule-store";

const fallbackMetadata: Metadata = {
  title: "Malabar Coast | Southern Indian Restaurant in Holytown",
  description: "Southern Indian coastal cooking from Malabar to Scotland.",
  alternates: {canonical: "/"},
};

export function generateMetadata() {
  return getMarketingPageMetadata("home", "/", fallbackMetadata);
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [page, {items: menuItems}, testimonials, promotions, dailySpecials, bookingSettings, siteSettings, schedule] = await Promise.all([getMarketingPage("home"), getMenuContent(), getTestimonials(), getActivePromotions(), getActiveDailySpecials(), getBookingSettings(), getSiteSettings(), getRestaurantSchedule()]);
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
    overviewEyebrow: overview?.eyebrow,
    overviewHeading: overview?.heading,
    overviewText: portableTextToPlainText(overview?.body),
    menuEyebrow: menu?.eyebrow,
    menuHeading: menu?.heading,
    menuText: portableTextToPlainText(menu?.body),
    reservationEyebrow: reservations?.eyebrow,
    reservationHeading: reservations?.heading,
    reservationText: reservations?.text,
    reservationPrimaryLink: reservations?.primaryLink,
    reservationSecondaryLink: reservations?.secondaryLink,
    mapUrl: siteSettings.mapUrl,
    mapEmbedUrl: siteSettings.mapEmbedUrl,
    coordinates: siteSettings.coordinates,
    testimonials,
  } : {};
  return <HomeExperience content={content} menuItems={menuItems} promotions={promotions} dailySpecials={dailySpecials} bookingSettings={bookingSettings} schedule={schedule} />;
}
