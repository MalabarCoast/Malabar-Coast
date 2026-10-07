import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {getActivePromotions} from "@/sanity/lib/promotions";
import {getMarketingPage, getMarketingPageMetadata} from "@/sanity/lib/pages";

export const revalidate = 60;

const fallbackMetadata: Metadata = {
  title: "Offers & Promotions",
  description: "See the current dining, collection and seasonal offers from Malabar Coast in Holytown.",
  alternates: {canonical: "/offers"},
};

export function generateMetadata() {
  return getMarketingPageMetadata("offers", "/offers", fallbackMetadata);
}

export default async function OffersPage() {
  const [promotions, page] = await Promise.all([getActivePromotions(), getMarketingPage("offers")]);

  return (
    <main className="offersPage">
      <header className="offersHero">
        <Image className="offersHeroImage" src={page?.heroImage?.url || "/restaurant/dining-room.png"} alt={page?.heroImage?.alt || "The dining room at Malabar Coast"} fill sizes="100vw" priority />
        <div className="offersHeroShade" />
        <p>{page?.eyebrow || "Current offers · From the coast"}</p>
        <h1>{page?.heroHeading || "Offers & specials."}</h1>
        <span>{page?.heroText || "Seasonal plates, dining offers and moments worth gathering for. Every live offer and its terms are shown below."}</span>
      </header>
      {promotions.length > 0 ? <section className="offersGrid" aria-label="Current promotions">
        {promotions.map((promotion, index) => (
          <article className="offerCard" key={promotion._id}>
            <div className="offerPoster">
              <Image
                src={promotion.poster.url}
                alt={promotion.poster.alt}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                priority={index < 2}
                placeholder={promotion.poster.lqip ? "blur" : "empty"}
                blurDataURL={promotion.poster.lqip}
              />
            </div>
            <div className="offerCardCopy">
              <p>{promotion.badge || "Current promotion"}</p>
              <h2>{promotion.title}</h2>
              {promotion.summary && <span>{promotion.summary}</span>}
              {promotion.validityLabel && <small>{promotion.validityLabel}</small>}
              <div className="offerCardActions">
                <Link href={promotion.callToAction?.href || "/book-a-table"} target={promotion.callToAction?.openInNewTab ? "_blank" : undefined} rel={promotion.callToAction?.openInNewTab ? "noreferrer" : undefined}>{promotion.callToAction?.label || "Book a table"} <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </article>
        ))}
      </section> : <section className="offersEmpty">
        <p>No offer is live just now.</p>
        <h2>The next taste is never far away.</h2>
        <span>Our team will publish new promotions here as soon as they are available.</span>
        <Link href="/menu">Explore the current menu <span aria-hidden="true">→</span></Link>
      </section>}
    </main>
  );
}
