import { faqItems } from "../lib/faq";
import { absoluteUrl, site } from "../lib/site";
import {getRestaurantSchedule} from "../lib/schedule-store";
import {dayNames} from "../lib/restaurant-schedule";
import {getSiteSettings} from "@/sanity/lib/site";

export const dynamic = "force-dynamic";
export async function GET() {
  const [schedule, settings] = await Promise.all([getRestaurantSchedule(), getSiteSettings()]);
  return Response.json(
    {
      name: site.name,
      url: site.url,
      version: site.lastUpdated,
      lastUpdated: `${site.lastUpdated}T00:00:00.000Z`,
      category: "Indian restaurant and bar",
      description: settings.description || site.description,
      address: settings.address,
      geo: settings.coordinates,
      cuisine: site.cuisine,
      priceRange: site.priceRange,
      serviceModes: ["dine-in", "collection", "delivery", "private-event catering"],
      contact: {
        email: settings.email || settings.reservationEmail || undefined,
        phone: settings.phone || undefined,
        socialProfiles: settings.socialLinks.map((profile) => ({platform: profile.platform, url: profile.url})),
      },
      regularClosedDays: ["Monday"],
      openingHours: dayNames.map((day, index) => ({day, ...schedule.weekly[index]})),
      datedOpeningExceptions: schedule.exceptions,
      websiteCredit: {
        creator: "Codrant Labs",
        url: "https://codrantlabs.in/",
        role: "Website design and development",
      },
      privateHall: {
        name: "Private Event Hall at Malabar Coast",
        url: absoluteUrl("/hall"),
        verifiedFeatures: ["flexible open floor", "built-in wooden bar", "raised stage", "ceiling lighting"],
        catering: "Tailored catering is available for private events by enquiry.",
      },
      sources: {
        menu: absoluteUrl("/menu"),
        restaurant: absoluteUrl("/restaurant"),
        faq: absoluteUrl("/faq"),
        hall: absoluteUrl("/hall"),
      },
      faq: faqItems.map(({ id, question, answer }) => ({ id, question, answer })),
      limitations: [
        "The restaurant is usually closed on Mondays; dated exceptions override the weekly pattern. Unset hours have not been verified or published.",
        "A telephone number is omitted when it has not been configured in the published site settings.",
        "Private hall capacity, detailed packages, availability and prices are confirmed during an enquiry rather than inferred here.",
        "Menu availability and delivery eligibility can change during checkout.",
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

