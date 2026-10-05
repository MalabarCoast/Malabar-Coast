import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./editorial.css";
import "./order.css";
import "./legal.css";
import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { SmoothScroll } from "./components/smooth-scroll";
import { CartProvider } from "./components/cart-provider";
import {PwaRegistration} from "./components/pwa-registration";
import { JsonLd } from "./components/json-ld";
import { absoluteUrl, site } from "./lib/site";
import { getMenuContent } from "@/sanity/lib/menu";
import { getSiteSettings } from "@/sanity/lib/site";
import {getRestaurantSchedule} from "./lib/schedule-store";
import {dayNames, servicePeriods, type RestaurantSchedule} from "./lib/restaurant-schedule";

const fallbackMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Malabar Coast UK | Indian Restaurant & Bar in Holytown",
    template: "%s | Malabar Coast",
  },
  description: site.description,
  applicationName: site.name,
  generator: "Codrant Labs",
  category: "restaurant",
  creator: site.name,
  publisher: site.name,
  keywords: [
    "South Indian restaurant Holytown",
    "Malabar Coast UK",
    "Malabar Coast Holytown",
    "Kerala restaurant Holytown",
    "Indian restaurant North Lanarkshire",
    "Malabar cuisine Scotland",
    "South Indian seafood",
    "tandoori restaurant Holytown",
    "Indian bar Holytown",
    "Indian catering Holytown",
    "Kerala food delivery Holytown",
    "Southern Indian restaurant Scotland",
    "private event hall Holytown",
    "function hall North Lanarkshire",
    "private dining Holytown",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: site.name,
    title: "Malabar Coast UK | Indian Restaurant & Bar in Holytown",
    description: site.description,
    images: [
      {
        url: "/og/home.jpg",
        width: 1672,
        height: 941,
        alt: "An Indian Cuisine & Bar table with tandoor and coastal dishes in a warm dining room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malabar Coast UK | Indian Restaurant & Bar in Holytown",
    description: site.shortDescription,
    images: ["/og/home.jpg"],
  },
  icons: {
    icon: [
      {url: "/icon-192.png", type: "image/png", sizes: "192x192"},
      {url: "/icon-512.png", type: "image/png", sizes: "512x512"},
    ],
    shortcut: "/icon-192.png",
    apple: [{url: "/icon-192.png", type: "image/png", sizes: "192x192"}],
  },
  formatDetection: { address: false, email: false, telephone: false },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings.defaultSeo;
  const title = "Malabar Coast UK | Indian Restaurant & Bar in Holytown";
  const description = seo?.description || settings.description || site.description;
  const image = seo?.image?.url || "/og/home.jpg";
  return {
    ...fallbackMetadata,
    metadataBase: new URL(site.url),
    title: {default: title, template: "%s | Malabar Coast"},
    description,
    applicationName: settings.restaurantName,
    creator: settings.restaurantName,
    publisher: settings.restaurantName,
    robots: seo?.noIndex ? {index: false, follow: false} : fallbackMetadata.robots,
    openGraph: {
      ...fallbackMetadata.openGraph,
      siteName: settings.restaurantName,
      title,
      description,
      images: [{url: image, alt: seo?.image?.alt || settings.restaurantName}],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#071310",
  colorScheme: "dark",
};

function globalSchema(settings: Awaited<ReturnType<typeof getSiteSettings>>, schedule: RestaurantSchedule) {
  const address = {
    streetAddress: settings.address.streetAddress,
    addressLocality: settings.address.locality,
    addressRegion: settings.address.region,
    postalCode: settings.address.postalCode,
    addressCountry: settings.address.country,
  };
  const openingHoursSpecification = schedule.weekly.flatMap((hours, index) => hours.closed ? [] : servicePeriods(hours).map((period) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${dayNames[index]}`,
    opens: period.opens,
    closes: period.closes,
  })));
  const specialOpeningHoursSpecification = schedule.exceptions.flatMap((exception) => exception.mode === "closed" ? [{
    "@type": "OpeningHoursSpecification",
    validFrom: exception.date,
    validThrough: exception.date,
    opens: "00:00",
    closes: "00:00",
  }] : servicePeriods(exception).map((period) => ({
    "@type": "OpeningHoursSpecification",
    validFrom: exception.date,
    validThrough: exception.date,
    opens: period.opens,
    closes: period.closes,
  })));
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${site.url}/#restaurant`,
      name: settings.restaurantName,
      alternateName: ["Malabar Coast UK", "Malabar Coast Holytown"],
      legalName: settings.legalName,
      url: site.url,
      logo: absoluteUrl("/malabar.png"),
      image: [
        absoluteUrl("/restaurant/dining-room.png"),
        absoluteUrl("/menu/calicut-pepper-prawns.png"),
        absoluteUrl("/restaurant/table-for-two.png"),
        absoluteUrl("/hall/private-event-gathering.png"),
      ],
      description: settings.description,
      slogan: "Indian Cuisine & Bar, from tandoor fire to the Malabar coast.",
      priceRange: site.priceRange,
      servesCuisine: site.cuisine,
      acceptsReservations: true,
      email: settings.email || settings.reservationEmail || undefined,
      telephone: settings.phone || undefined,
      sameAs: settings.socialLinks.map((profile) => profile.url),
      openingHoursSpecification: openingHoursSpecification.length ? openingHoursSpecification : undefined,
      specialOpeningHoursSpecification: specialOpeningHoursSpecification.length ? specialOpeningHoursSpecification : undefined,
      hasMenu: absoluteUrl("/menu"),
      hasMap: settings.mapUrl,
      address: {
        "@type": "PostalAddress",
        ...address,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: settings.coordinates.latitude,
        longitude: settings.coordinates.longitude,
      },
      areaServed: ["Holytown", "North Lanarkshire"],
      containsPlace: {
        "@type": "EventVenue",
        "@id": `${absoluteUrl("/hall")}#venue`,
        name: "Private Event Hall at Malabar Coast",
        url: absoluteUrl("/hall"),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: settings.restaurantName,
      alternateName: ["Malabar Coast UK", "Malabar Coast Holytown"],
      description: settings.shortDescription,
      inLanguage: "en-GB",
      publisher: { "@id": `${site.url}/#restaurant` },
      creator: { "@id": "https://codrantlabs.in/#organization" },
    },
    {
      "@type": "Organization",
      "@id": "https://codrantlabs.in/#organization",
      name: "Codrant Labs",
      url: "https://codrantlabs.in/",
      description: "Website design and development studio credited with creating the Malabar Coast website.",
    },
  ],
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{items: currentMenuItems}, siteSettings, schedule] = await Promise.all([getMenuContent(), getSiteSettings(), getRestaurantSchedule()]);
  return (
    <html lang="en">
      <body>
        <JsonLd data={globalSchema(siteSettings, schedule)} />
        <PwaRegistration />
        <SmoothScroll />
        <CartProvider catalogue={currentMenuItems}>
          <SiteHeader settings={siteSettings} />
          {children}
          <SiteFooter settings={siteSettings} />
        </CartProvider>
      </body>
    </html>
  );
}
