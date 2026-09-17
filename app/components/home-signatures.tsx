"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type MenuItem } from "../lib/menu";
import { AddToOrder } from "./add-to-order";
import type {DailySpecial} from "@/sanity/lib/daily-specials";

const featuredDishes = [
  {
    id: "malabar-coast-signature-konju-coconut-fry",
    image: "/menu/calicut-pepper-prawns.png",
    alt: "Black pepper tiger prawns with curry leaf and charred lime",
    note: "From Calicut · Small plate",
  },
  {
    id: "clay-oven-chicken-tikka",
    image: "/menu/chicken-tikka.png",
    alt: "Charred chicken tikka with red onion and grilled lemon",
    note: "From Delhi · Tandoor fire",
  },
  {
    id: "malabar-coast-signature-aattirachi-kurumulak",
    image: "/menu/cape-malay-lamb.png",
    alt: "Pepper-spiced lamb with flaky porotta",
    note: "From the fire · Made for sharing",
  },
] as const;

export function HomeSignatures({items, specials, eyebrow, heading, introduction}: {items: MenuItem[]; specials: DailySpecial[]; eyebrow?: string; heading?: string; introduction?: string}) {
  const hasSpecials = specials.length > 0;
  return (
    <section className="homeSignatures" aria-labelledby="home-signatures-title">
      <div className="homeSignaturesIntro">
        <div className="homeSignaturesMeta">
          <span>{eyebrow || "Featured dishes · 03 plates"}</span>
          <span>From coast and tandoor</span>
        </div>
        <div className="homeSignaturesHeading">
          <h2 id="home-signatures-title">{heading || <>Come to<br />the table.</>}</h2>
          <div>
            <p>
              {introduction || "From tandoor-charred Chicken Tikka to coconut-rich coastal plates and slow-cooked lamb, our table travels across India."}
            </p>
            <Link className="homeSpecialsOfferLink" href="/offers">{hasSpecials ? `See ${specials.length} kitchen special${specials.length === 1 ? "" : "s"} & offers` : "See current offers"} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>

      <div className="homeSignatureGrid">
        {featuredDishes.map((featured, index) => {
          const dish = items.find((item) => item.id === featured.id);
          if (!dish) return null;

          return (
            <article className={`homeSignatureCard homeSignatureCard${index + 1}`} key={dish.id}>
              <div className="homeSignatureImage">
                <Image
                  src={featured.image}
                  alt={featured.alt}
                  fill
                  sizes={index === 0 ? "(max-width: 720px) 100vw, 50vw" : "(max-width: 720px) 100vw, 25vw"}
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="homeSignatureCopy">
                <p>{featured.note}</p>
                <h3>{dish.name}</h3>
                {dish.description && <span>{dish.description}</span>}
                <div className="homeSignatureOrder">
                  <strong>{formatPrice(dish.pricePence)}</strong>
                  {dish.onlineOrdering && <AddToOrder id={dish.id} compact />}
                </div>
              </div>
            </article>
          );
        })}
        <Link className="homeSignatureMenuCta" href="/menu">
          <span>
            <small>Beyond the signatures</small>
            <strong>Explore the full menu</strong>
          </span>
          <i aria-hidden="true">↗</i>
        </Link>
      </div>
    </section>
  );
}
