const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveSiteUrl() {
  try {
    return new URL(configuredSiteUrl || "http://localhost:3000").origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const site = {
  name: "Malabar Coast",
  legalName: "Malabar Coast",
  url: resolveSiteUrl(),
  description:
    "Malabar Coast is a Southern Indian coastal restaurant in Holytown, Scotland, serving Kerala-inspired seafood, curries, biriyani and plant-based dishes.",
  shortDescription: "Southern Indian coastal cooking from Malabar to Scotland.",
  cuisine: ["South Indian", "Kerala", "Indian", "Seafood"],
  priceRange: "££",
  lastUpdated: "2026-09-14",
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

export function absoluteUrl(path = "/") {
  return new URL(path, `${site.url}/`).toString();
}

