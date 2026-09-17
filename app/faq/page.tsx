import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl, formatPublicDate, pageLastUpdated } from "../lib/site";
import {getFaqItems} from "@/sanity/lib/faq";
import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";

const fallbackMetadata: Metadata = {
  title: "Restaurant FAQs",
  description:
    "Answers about Malabar Coast in Holytown, including cuisine, location, private hall, ordering, delivery, dietary choices, allergens and spice levels.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: "/faq",
    title: "Restaurant FAQs | Malabar Coast",
    description: "Clear answers about Indian cuisine, tandoor dishes, catering, the private event hall, ordering and dining at Malabar Coast.",
    images: ["/restaurant/table-for-two.png"],
  },
};

export function generateMetadata() {
  return getMarketingPageMetadata("faq", "/faq", fallbackMetadata);
}

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Restaurant FAQs", item: absoluteUrl("/faq") },
  ],
};

export default async function FaqPage() {
  const [faqItems, page] = await Promise.all([getFaqItems(), getMarketingPage("faq")]);
  const closing = getPageSection(page, "faq-closing");
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/faq")}#faq`,
    url: absoluteUrl("/faq"),
    name: "Malabar Coast restaurant frequently asked questions",
    datePublished: pageLastUpdated["/faq"],
    dateModified: pageLastUpdated["/faq"],
    inLanguage: "en-GB",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      "@id": `${absoluteUrl("/faq")}#${item.id}`,
      name: item.question,
      datePublished: pageLastUpdated["/faq"],
      dateModified: pageLastUpdated["/faq"],
      acceptedAnswer: {"@type": "Answer", text: item.answer},
    })),
  };
  return (
    <main className="faqPage">
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <header className="faqHero">
        <p>{page?.eyebrow || "Good to know · Clear answers"}</p>
        <h1 aria-label={page?.heroHeading || "Before you come ashore."}><span>{page?.heroHeading || "Before you"}</span>{!page?.heroHeading && <span>come ashore.</span>}</h1>
        <div>
          <p>
            {page?.heroText || "Direct answers about the food, private hall, dietary choices, location and ordering at Malabar Coast in Holytown."}
          </p>
          <time dateTime={pageLastUpdated["/faq"]}>Last reviewed {formatPublicDate(pageLastUpdated["/faq"])}</time>
        </div>
      </header>

      <section className="faqList" aria-label="Frequently asked questions">
        {faqItems.map((item, index) => (
          <details id={item.id} key={item.id} open={index === 0}>
            <summary>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{item.question}</h2>
              <i aria-hidden="true" />
            </summary>
            <div>
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </section>

      <footer className="faqFooter">
        <p>{closing?.eyebrow || "Ready for the table?"}</p>
        <h2>{closing?.heading || "Follow the flavour."}</h2>
        {portableTextToPlainText(closing?.body) && <span>{portableTextToPlainText(closing?.body)}</span>}
        <div>
          <Link href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
          <Link href="/hall">Explore the private hall <span aria-hidden="true">↗</span></Link>
          <Link href="/book-a-table">Book your table <span aria-hidden="true">→</span></Link>
        </div>
      </footer>
    </main>
  );
}
