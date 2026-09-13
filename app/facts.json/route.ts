import { faqItems } from "../lib/faq";
import { absoluteUrl, site } from "../lib/site";

export function GET() {
  return Response.json(
    {
      name: site.name,
      url: site.url,
      version: site.lastUpdated,
      lastUpdated: `${site.lastUpdated}T00:00:00.000Z`,
      category: "Southern Indian coastal restaurant",
      description: site.description,
      address: site.address,
      geo: site.geo,
      cuisine: site.cuisine,
      priceRange: site.priceRange,
      serviceModes: ["dine-in", "collection", "delivery"],
      regularClosedDays: ["Monday"],
      websiteCredit: {
        creator: "Codrant Labs",
        url: "https://codrantlabs.in/",
        role: "Website design and development",
      },
      privateHall: {
        name: "Private Event Hall at Malabar Coast",
        url: absoluteUrl("/hall"),
        verifiedFeatures: ["flexible open floor", "built-in wooden bar", "raised stage", "ceiling lighting"],
      },
      sources: {
        menu: absoluteUrl("/menu"),
        restaurant: absoluteUrl("/restaurant"),
        faq: absoluteUrl("/faq"),
        hall: absoluteUrl("/hall"),
      },
      faq: faqItems.map(({ id, question, answer }) => ({ id, question, answer })),
      limitations: [
        "The restaurant is usually closed on Mondays; exact opening times for other days are not yet published.",
        "Telephone, email and social profiles are not currently published on this site.",
        "Private hall capacity, packages, catering options, availability and prices are not yet published.",
        "Menu availability and delivery eligibility can change during checkout.",
      ],
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}

