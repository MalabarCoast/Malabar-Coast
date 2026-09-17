const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveSiteUrl() {
  try {
    return new URL(configuredSiteUrl || "https://malabarcoast.co.uk").origin;
  } catch {
    return "https://malabarcoast.co.uk";
  }
}

export const site = {
  name: "Malabar Coast",
  legalName: "Malabar Coast",
  url: resolveSiteUrl(),
  description:
    "Malabar Coast is an Indian restaurant and bar in Holytown, Scotland, serving tandoor dishes, curries, biriyani, vegetarian plates and Malabar coastal specialities.",
  shortDescription: "Indian Cuisine & Bar, from tandoor fire to the Malabar coast.",
  cuisine: ["Indian", "North Indian", "South Indian", "Tandoori", "Kerala", "Seafood"],
  priceRange: "££",
  lastUpdated: "2026-09-17",
  address: {
    streetAddress: "33 Main Street",
    addressLocality: "Holytown",
    addressRegion: "North Lanarkshire",
    postalCode: "ML1 4TH",
    addressCountry: "GB",
  },
  geo: {
    latitude: 55.82137044664088,
    longitude: -3.977184928534912,
  },
  maps: {
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=MALABAR+COAST+33+Main+Street+Holytown+ML1+4TH",
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d166.5915347424156!2d-3.977184928534912!3d55.82137044664088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48886d005a9bd0b5%3A0x9fbf2c81d7d0d5e8!2sMALABAR%20COAST!5e0!3m2!1sen!2sin!4v1788676352372!5m2!1sen!2sin",
  },
} as const;

export const pageLastUpdated = {
  "/": "2026-09-17",
  "/menu": "2026-09-17",
  "/offers": "2026-08-16",
  "/book-a-table": "2026-09-14",
  "/restaurant": "2026-09-17",
  "/hall": "2026-09-17",
  "/careers": "2026-09-17",
  "/story": "2026-09-17",
  "/story/calicut": "2026-08-16",
  "/faq": "2026-09-17",
  "/payments": "2026-08-15",
  "/returns": "2026-08-15",
  "/cookie": "2026-08-16",
  "/privacy": "2026-08-16",
} as const;

export function formatPublicDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {day: "numeric", month: "long", year: "numeric", timeZone: "UTC"}).format(new Date(`${value}T12:00:00Z`));
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${site.url}/`).toString();
}

