import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./menu/menu.css";
import "./editorial.css";
import "./order.css";
import "./faq/faq.css";
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
import {dayNames, type RestaurantSchedule} from "./lib/restaurant-schedule";

const fallbackMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Malabar Coast | Indian Cuisine & Bar in Holytown",
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
  alternates: { canonical: "/" },
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
    title: "Malabar Coast | Indian Cuisine & Bar in Holytown",
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
    title: "Malabar Coast | Indian Cuisine & Bar in Holytown",
    description: site.shortDescription,
    images: ["/og/home.jpg"],
  },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  formatDetection: { address: false, email: false, telephone: false },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const seo = settings.defaultSeo;
  const title = seo?.title || "Malabar Coast | Indian Cuisine & Bar in Holytown";
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
  const openingHoursSpecification = schedule.weekly.flatMap((hours, index) => hours.closed || !hours.opens || !hours.closes ? [] : [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: `https://schema.org/${dayNames[index]}`,
    opens: hours.opens,
    closes: hours.closes,
  }]);
  const specialOpeningHoursSpecification = schedule.exceptions.map((exception) => ({
    "@type": "OpeningHoursSpecification",
    validFrom: exception.date,
    validThrough: exception.date,
    opens: exception.mode === "closed" ? "00:00" : exception.opens || undefined,
    closes: exception.mode === "closed" ? "00:00" : exception.closes || undefined,
  }));
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${site.url}/#restaurant`,
      name: settings.restaurantName,
      legalName: settings.legalName,
      url: site.url,
      logo: settings.logo.url,
      image: [
        absoluteUrl("/restaurant/dining-room.png"),
        absoluteUrl("/menu/calicut-pepper-prawns.png"),
        absoluteUrl("/restaurant/table-for-two.png"),
        absoluteUrl("/Hall1.jpeg"),
      ],
      description: settings.description,
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
