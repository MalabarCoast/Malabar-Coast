import type {Metadata} from "next";
import Link from "next/link";
import {AddToOrder} from "@/app/components/add-to-order";
import {CmsSanityImage} from "@/app/components/cms-sanity-image";
import {formatPrice} from "@/app/lib/menu";
import {getActiveDailySpecials} from "@/sanity/lib/daily-specials";
import {getActivePromotions} from "@/sanity/lib/promotions";
import {getMarketingPage, getMarketingPageMetadata} from "@/sanity/lib/pages";

export const revalidate = 60;

const fallbackMetadata: Metadata = {
  title: "Offers & Promotions",
  description: "See the current dining, collection and seasonal offers from Malabar Coast in Holytown.",
  alternates: {canonical: "/offers"},
};

const fallbackHero = {
  url: "/restaurant/dining-room.png",
  alt: "The dining room at Malabar Coast",
};

export function generateMetadata() {
  return getMarketingPageMetadata("offers", "/offers", fallbackMetadata);
}

export default async function OffersPage() {
  const [dailySpecials, promotions, page] = await Promise.all([
    getActiveDailySpecials(),
    getActivePromotions(),
    getMarketingPage("offers"),
  ]);
  const heroImage = page?.heroImage || fallbackHero;
  const hasOffers = dailySpecials.length > 0 || promotions.length > 0;

  return (
    <main className="offersPage">
      <header className="offersHero">
        <CmsSanityImage className="offersHeroImage" image={heroImage} width={1920} alt={heroImage.alt} sizes="100vw" eager />
        <div className="offersHeroShade" />
        <p>{page?.eyebrow || "Current offers · From the coast"}</p>
        <h1>{page?.heroHeading || "Offers & specials."}</h1>
        <span>{page?.heroText || "Seasonal plates, dining offers and moments worth gathering for. Every live offer and its terms are shown below."}</span>
      </header>

      {hasOffers ? <div className="offersGrid">
        {dailySpecials.length > 0 && <section className="offersCollection" aria-labelledby="daily-specials-heading">
          <header className="offersCollectionIntro">
            <div>
              <p>From today&apos;s menu</p>
              <h2 id="daily-specials-heading">Kitchen specials</h2>
            </div>
            <span>Chosen directly from the live menu catalogue. Dish names, images, descriptions and standard prices stay in sync with the menu.</span>
            <small>{dailySpecials.length} live {dailySpecials.length === 1 ? "dish" : "dishes"}</small>
          </header>
          <div className="offersCollectionCards">
            {dailySpecials.map((special, index) => {
              const canOrder = special.status === "active" && special.menuItem?.available && special.menuItem.onlineOrdering && !special.menuItem.isAlcoholic;
              return <article className="offerCard offerCardSpecial" key={special._id}>
                <div className="offerPoster">
                  <CmsSanityImage
                    image={special.image}
                    width={1120}
                    alt={special.image.alt}
                    sizes="(max-width: 760px) 100vw, 42vw"
                    eager={index === 0}
                  />
                </div>
                <div className="offerCardCopy">
                  <p>{special.badge || "Today’s special"}</p>
                  <h3>{special.title}</h3>
                  <span>{special.description}</span>
                  <div className="offerSpecialDetails">
                    <strong>{formatPrice(special.pricePence)}</strong>
                    {(special.priceNote || special.dietaryNote) && <small>{[special.priceNote, special.dietaryNote].filter(Boolean).join(" · ")}</small>}
                  </div>
                  <div className="offerCardActions">
                    {special.status === "soldOut" ? <span className="offerCardStatus">Sold out today</span>
                      : canOrder && special.menuItem ? <AddToOrder id={special.menuItem.id} compact />
                        : <Link href={special.callToAction?.href || "/menu"} target={special.callToAction?.openInNewTab ? "_blank" : undefined} rel={special.callToAction?.openInNewTab ? "noreferrer" : undefined}>{special.callToAction?.label || "Explore the menu"} <span aria-hidden="true">→</span></Link>}
                  </div>
                </div>
              </article>;
            })}
          </div>
        </section>}

        {promotions.length > 0 && <section className="offersCollection" aria-labelledby="promotions-heading">
          <header className="offersCollectionIntro">
            <div>
              <p>Dining & occasions</p>
              <h2 id="promotions-heading">Promotions & offers</h2>
            </div>
            <span>Seasonal dining, celebrations and booking offers. These are managed separately from menu-linked kitchen specials.</span>
            <small>{promotions.length} live {promotions.length === 1 ? "offer" : "offers"}</small>
          </header>
          <div className="offersCollectionCards">
            {promotions.map((promotion, index) => (
              <article className="offerCard" key={promotion._id}>
                <div className="offerPoster">
                  <CmsSanityImage
                    image={promotion.poster}
                    width={1120}
                    alt={promotion.poster.alt}
                    sizes="(max-width: 760px) 100vw, 42vw"
                    eager={dailySpecials.length === 0 && index === 0}
                  />
                </div>
                <div className="offerCardCopy">
                  <p>{promotion.badge || "Current promotion"}</p>
                  <h3>{promotion.title}</h3>
                  {promotion.summary && <span>{promotion.summary}</span>}
                  {promotion.validityLabel && <small>{promotion.validityLabel}</small>}
                  <div className="offerCardActions">
                    <Link href={promotion.callToAction?.href || "/book-a-table"} target={promotion.callToAction?.openInNewTab ? "_blank" : undefined} rel={promotion.callToAction?.openInNewTab ? "noreferrer" : undefined}>{promotion.callToAction?.label || "Book a table"} <span aria-hidden="true">→</span></Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>}
      </div> : <section className="offersEmpty">
        <p>No offer is live just now.</p>
        <h2>The next taste is never far away.</h2>
        <span>Our team will publish new promotions here as soon as they are available.</span>
        <Link href="/menu">Explore the current menu <span aria-hidden="true">→</span></Link>
      </section>}
    </main>
  );
}
