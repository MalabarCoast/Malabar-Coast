import type { Metadata } from "next";
import Image from "next/image";
import { StoryTransitionLink } from "../story-transition-link";
import { DetailCanvas } from "./detail-canvas";
import { JsonLd } from "../../components/json-ld";
import { absoluteUrl, pageLastUpdated } from "../../lib/site";
import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";

const fallbackMetadata: Metadata = {
  title: "Calicut: The First Spice Port",
  description: "Enter the historic spice port of Calicut, where pepper, monsoon winds and cultures met.",
  alternates: { canonical: "/story/calicut" },
  openGraph: {
    type: "article",
    url: "/story/calicut",
    title: "Calicut: The First Spice Port | Malabar Coast",
    description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast.",
    images: ["/story/calicut-spice-port.png"],
  },
};

export function generateMetadata() {
  return getMarketingPageMetadata("story-calicut", "/story/calicut", fallbackMetadata);
}

const calicutSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Calicut: The First Spice Port",
      description: "How pepper, monsoon winds and cultural exchange shaped the food of the Malabar Coast.",
      image: absoluteUrl("/story/calicut-spice-port.png"),
      mainEntityOfPage: absoluteUrl("/story/calicut"),
      datePublished: "2026-07-13",
      dateModified: pageLastUpdated["/story/calicut"],
      author: { "@id": `${absoluteUrl("/")}#restaurant` },
      publisher: { "@id": `${absoluteUrl("/")}#restaurant` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Our story", item: absoluteUrl("/story") },
        { "@type": "ListItem", position: 3, name: "Calicut", item: absoluteUrl("/story/calicut") },
      ],
    },
  ],
};

export default async function CalicutStoryPage() {
  const page = await getMarketingPage("story-calicut");
  const introduction = getPageSection(page, "calicut-intro");
  const pepper = getPageSection(page, "calicut-pepper");
  const monsoon = getPageSection(page, "calicut-monsoon");
  const exchange = getPageSection(page, "calicut-exchange");
  const next = getPageSection(page, "calicut-next");
  return (
    <DetailCanvas>
      <JsonLd data={calicutSchema} />
      <section className="calicutHero" aria-labelledby="calicut-title">
        <Image
          className="calicutHeroImage"
          src={page?.heroImage?.url || "/story/calicut-spice-port.png"}
          alt={page?.heroImage?.alt || "The historic spice port of Calicut opening onto the Arabian Sea"}
          fill
          sizes="100vw"
          priority
        />
        <div className="calicutHeroShade" />
        <div className="calicutHeroGrid" aria-hidden="true" />
        <div className="calicutHeroMeta">
          <span>{page?.eyebrow || "Archive 01 · The first port"}</span>
          <span>Calicut · Malabar Coast</span>
        </div>
        <h1 id="calicut-title" aria-label={page?.heroHeading || "Calicut"}>
          {page?.heroHeading ? <span className="calicutTitleLine"><span>{page.heroHeading}</span></span> : <>
          <span className="calicutTitleLine"><span>Cali</span></span>
          <span className="calicutTitleLine calicutTitleOffset"><span>cut.</span></span>
          </>}
        </h1>
        <div className="calicutHeroFooter">
          <span>11.2588° N</span><i /><span>75.7804° E</span>
        </div>
      </section>

      <section className="calicutIntro" aria-labelledby="calicut-intro-title">
        <div data-detail-reveal>
          <span>{introduction?.eyebrow || "01 / The beginning"}</span>
          <p>{introduction?.note || "Arabian Sea · Monsoon season"}</p>
        </div>
        <h2 id="calicut-intro-title" data-detail-reveal>{introduction?.heading || "The harbour where flavour became history."}</h2>
        <p data-detail-reveal>
          {portableTextToPlainText(introduction?.body) || page?.heroText || "Long before it appeared in a recipe book, Malabar pepper was measured here by hand, loaded into wooden vessels and carried by the turning winds. Calicut was less a border than a threshold, the place where soil, sea and distant tables met."}
        </p>
      </section>

      <section className="calicutArchive" aria-label="Objects from the spice trade">
        <figure className="calicutPlate calicutPlateWide" data-cursor-label="BLACK GOLD">
          <div>
            <Image
              src={pepper?.image?.url || "/story/pepper-balance.png"}
              alt={pepper?.image?.alt || "Peppercorns weighed on a brass merchant's balance"}
              fill
              sizes="(max-width: 800px) 100vw, 68vw"
            />
          </div>
          <figcaption><span>Merchant’s balance · Black pepper</span><span>Object 01</span></figcaption>
        </figure>

        <aside data-detail-reveal>
          <span>{pepper?.eyebrow || "The black gold of Malabar"}</span>
          <blockquote>{pepper?.heading || "Small enough to hold between two fingers. Valuable enough to redraw the world."}</blockquote>
          <p>
            {portableTextToPlainText(pepper?.body) || "Pepper thrived in the wet shade of the Western Ghats. Its heat was clean, floral and enduring, qualities that made it currency, medicine and obsession in ports thousands of miles away."}
          </p>
        </aside>

        <figure className="calicutPlate calicutPlateTall" data-cursor-label="FOLLOW THE MONSOON">
          <div>
            <Image
              src={monsoon?.image?.url || "/story/western-ghats.png"}
              alt={monsoon?.image?.alt || "Pepper vines climbing through the monsoon forest of the Western Ghats"}
              fill
              sizes="(max-width: 800px) 100vw, 46vw"
            />
          </div>
          <figcaption><span>Western Ghats · Pepper vines</span><span>Landscape 02</span></figcaption>
        </figure>
      </section>

      <section className="calicutLedger" aria-labelledby="ledger-title">
        <div data-detail-reveal>
          <p>{exchange?.eyebrow || "Port ledger · A living exchange"}</p>
          <h2 id="ledger-title">{exchange?.heading || <>What arrived.<br />What remained.</>}</h2>
        </div>
        <dl>
          {(exchange?.items?.length ? exchange.items : [
            {_key: "arabia", title: "Arabia", text: "Rice, perfume, a language of hospitality", shortLabel: "01"},
            {_key: "china", title: "China", text: "Ceramics, fishing nets, quiet craft", shortLabel: "02"},
            {_key: "portugal", title: "Portugal", text: "Chilli, vinegar, a new kind of heat", shortLabel: "03"},
            {_key: "malabar", title: "Malabar", text: "Pepper, coconut, generosity without end", shortLabel: "04"},
          ]).map((item, index) => <div data-detail-reveal key={item._key}><dt>{item.title}</dt><dd>{item.text}</dd><span>{item.shortLabel || String(index + 1).padStart(2, "0")}</span></div>)}
        </dl>
      </section>

      <footer className="calicutNext">
        <p>{next?.eyebrow || "Return to the full journey"}</p>
        <StoryTransitionLink href="/story" data-cursor-label="BACK TO OUR STORY">
          <span>{next?.heading || "Our story"}</span><i>↗</i>
        </StoryTransitionLink>
        <small>Malabar Coast · India to Scotland</small>
      </footer>
    </DetailCanvas>
  );
}
