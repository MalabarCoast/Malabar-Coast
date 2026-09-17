import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl, pageLastUpdated } from "../lib/site";
import { getMenuContent } from "@/sanity/lib/menu";

const fallbackMetadata: Metadata = {
  title: "Indian Menu",
  description:
    "Explore Malabar Coast's Indian menu in Holytown, with tandoor dishes, curries, biriyani, Malabar seafood, vegetarian choices and published food prices.",
  alternates: { canonical: "/menu" },
  openGraph: {
    type: "website",
    url: "/menu",
    title: "Indian Menu | Malabar Coast Holytown",
    description: "Tandoor dishes, curries, biriyani, Malabar seafood and vegetarian choices with current food prices and clear dietary-review notices.",
    images: ["/og/menu.png"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const {page} = await getMenuContent();
  const title = page.seo?.title || fallbackMetadata.title;
  const description = page.seo?.description || fallbackMetadata.description;
  return {
    ...fallbackMetadata,
    title,
    description,
    robots: page.seo?.noIndex ? {index: false, follow: false} : fallbackMetadata.robots,
    openGraph: {
      ...fallbackMetadata.openGraph,
      title: typeof title === "string" ? title : undefined,
      description: typeof description === "string" ? description : undefined,
      images: page.seo?.image?.url ? [{url: page.seo.image.url, alt: page.seo.image.alt || "Malabar Coast menu"}] : fallbackMetadata.openGraph?.images,
    },
  };
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Menu", item: absoluteUrl("/menu") },
  ],
};

export default async function MenuLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const {categories, items} = await getMenuContent();
  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${absoluteUrl("/menu")}#menu`,
    name: "Malabar Coast menu",
    url: absoluteUrl("/menu"),
    inLanguage: "en-GB",
    dateModified: pageLastUpdated["/menu"],
    mainEntityOfPage: absoluteUrl("/menu"),
    hasMenuSection: categories.map((category) => ({
      "@type": "MenuSection",
      name: category.title,
      description: category.description,
      hasMenuItem: items.filter((item) => item.category === category.slug).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description || undefined,
        identifier: item.id,
        ...(item.pricePence !== null && !item.hidePrice ? {offers: {
          "@type": "Offer",
          price: (item.pricePence / 100).toFixed(2),
          priceCurrency: "GBP",
          availability: item.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${absoluteUrl("/menu")}#${category.slug}`,
        }} : {}),
      })),
    })),
  };
  return (
    <>
      <JsonLd data={[menuSchema, breadcrumbSchema]} />
      {children}
    </>
  );
}

