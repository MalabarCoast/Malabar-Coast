import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {HomeExperience, type HomeCmsContent} from "./home-experience";
import {getMenuContent} from "@/sanity/lib/menu";
import {getTestimonials} from "@/sanity/lib/testimonials";
import {getActiveDailySpecials} from "@/sanity/lib/daily-specials";
import {getBookingSettings} from "./lib/booking-store";
import type {Metadata} from "next";
import {getSiteSettings} from "@/sanity/lib/site";
import {getRestaurantSchedule} from "./lib/schedule-store";

const fallbackMetadata: Metadata = {
  title: "Malabar Coast | Indian Cuisine & Bar in Holytown",
  description: "Indian tandoor dishes, curries, biriyani and Malabar coastal cooking in Holytown.",
  alternates: {canonical: "/"},
};

export function generateMetadata() {
  return getMarketingPageMetadata("home", "/", fallbackMetadata);
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [page, {items: menuItems}, testimonials, dailySpecials, bookingSettings, siteSettings, schedule] = await Promise.all([getMarketingPage("home"), getMenuContent(), getTestimonials(), getActiveDailySpecials(), getBookingSettings(), getSiteSettings(), getRestaurantSchedule()]);
  const overview = getPageSection(page, "home-overview");
  const menu = getPageSection(page, "home-menu");
  const reservations = getPageSection(page, "home-reservations");
  const content: HomeCmsContent = page ? {
    heroEyebrow: "Indian Cuisine & Bar · Holytown · Scotland",
    heroHeading: page.heroHeading,
    heroText: "Tandoor fire, fragrant biriyani, rich curries and Malabar coastal flavours, served with a full bar in the heart of Holytown.",
    heroImage: page.heroImage,
    heroPrimaryLink: page.heroPrimaryLink,
    heroSecondaryLink: page.heroSecondaryLink,
    overviewEyebrow: overview?.eyebrow,
    overviewHeading: overview?.heading,
    overviewText: portableTextToPlainText(overview?.body),
    menuEyebrow: "From coast and tandoor",
    menuHeading: menu?.heading,
    menuText: "From tandoor-charred Chicken Tikka to coconut-rich coastal plates and slow-cooked lamb, our table travels across India.",
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
  return <HomeExperience content={content} menuItems={menuItems} dailySpecials={dailySpecials} bookingSettings={bookingSettings} schedule={schedule} />;
}
