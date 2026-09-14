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

const fallbackMetadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Malabar Coast | Southern Indian Restaurant in Holytown",
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
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.description,
    images: [
      {
        url: "/malabar-restaurant-hero-v2.jpg",
        width: 1672,
        height: 941,
        alt: "A Kerala-inspired restaurant table with coastal dishes in a warm dining room",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Malabar Coast | Southern Indian Restaurant in Holytown",
    description: site.shortDescription,
    images: ["/malabar-restaurant-hero-v2.jpg"],
  },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  formatDetection: { address: false, email: false, telephone: false },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const canonical = (() => {
    try { return new URL(settings.siteUrl); } catch { return new URL(site.url); }
  })();
  const seo = settings.defaultSeo;
  const title = seo?.title || "Malabar Coast | Southern Indian Restaurant in Holytown";
  const description = seo?.description || settings.description || site.description;
  const image = seo?.image?.url || "/malabar-restaurant-hero-v2.jpg";
  return {
    ...fallbackMetadata,
    metadataBase: canonical,
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

function globalSchema(settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  const address = {
    streetAddress: settings.address.streetAddress,
    addressLocality: settings.address.locality,
    addressRegion: settings.address.region,
    postalCode: settings.address.postalCode,
    addressCountry: settings.address.country,
  };
  return {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Restaurant",
      "@id": `${site.url}/#restaurant`,
      name: settings.restaurantName,
      legalName: settings.legalName,
      url: settings.siteUrl,
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
      url: settings.siteUrl,
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
  const [{items: currentMenuItems}, siteSettings] = await Promise.all([getMenuContent(), getSiteSettings()]);
  return (
    <html lang="en">
      <body>
        <JsonLd data={globalSchema(siteSettings)} />
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
