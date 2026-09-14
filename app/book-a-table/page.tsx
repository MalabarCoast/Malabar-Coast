import type { Metadata } from "next";
import { TableBookingForm } from "../components/table-booking-form";
import { getBookingSettings } from "../lib/booking-store";
import {getRestaurantSchedule} from "../lib/schedule-store";
import Link from "next/link";
import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";

export const dynamic = "force-dynamic";
const fallbackMetadata: Metadata = { title: "Book a Table", description: "Reserve a table at Malabar Coast in Holytown.", alternates: { canonical: "/book-a-table" } };

export function generateMetadata() {
  return getMarketingPageMetadata("book-a-table", "/book-a-table", fallbackMetadata);
}

export default async function BookATablePage() {
  const [settings, schedule, page] = await Promise.all([getBookingSettings(), getRestaurantSchedule(), getMarketingPage("book-a-table")]);
  const details = getPageSection(page, "booking-details");
  return <main className="bookingPage">
    <section className="bookingIntro"><p>{page?.eyebrow || "Book your table · Holytown"}</p><h1>{page?.heroHeading || <>Come sit<br />by the coast.</>}</h1><span>{page?.heroText || `Choose a date, arrival time and party size. We check the restaurant's live ${settings.capacity}-seat capacity before confirming your table.`}<span className="bookingIntroLinks"><Link href={page?.heroPrimaryLink?.href || "/menu"}>{page?.heroPrimaryLink?.label || "See what's cooking"} <b aria-hidden="true">↗</b></Link><Link href={page?.heroSecondaryLink?.href || "/hall"}>{page?.heroSecondaryLink?.label || "Planning something bigger?"} <b aria-hidden="true">↗</b></Link></span></span></section>
    <section className="bookingWorkspace"><div><p>{details?.eyebrow || "Before you book"}</p><h2>{details?.heading || <>A table prepared<br />for your people.</>}</h2>{portableTextToPlainText(details?.body) && <span>{portableTextToPlainText(details?.body)}</span>}<ul><li><b>{settings.sittingMinutes} minutes</b><span>Reserved for each table</span></li><li><b>Up to {settings.maximumPartySize}</b><span>Guests per online booking</span></li><li><b>{Math.ceil(settings.minimumLeadMinutes/60)} hours</b><span>Minimum booking notice</span></li></ul><nav className="bookingSideLinks"><Link href="/offers">Today&apos;s offers <span>→</span></Link><Link href="/faq">Questions before you book <span>→</span></Link></nav></div><div className="bookingFormCard"><TableBookingForm settings={settings} schedule={schedule} /></div></section>
  </main>;
}
