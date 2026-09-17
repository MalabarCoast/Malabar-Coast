"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeStoryScroll } from "./components/home-story-scroll";
import { HomeSignatures } from "./components/home-signatures";
import { HomeTestimonials } from "./components/home-testimonials";
import type {MenuItem} from "./lib/menu";
import type {TestimonialRecord} from "@/sanity/lib/testimonials";
import type {DailySpecial} from "@/sanity/lib/daily-specials";
import type {BookingSettings} from "./lib/bookings";
import {TableBookingForm} from "./components/table-booking-form";
import {OpeningHours} from "./components/opening-hours";
import type {RestaurantSchedule} from "./lib/restaurant-schedule";
import {malabarCoastIntroduction} from "./lib/brand-content";
import {formatPublicDate, pageLastUpdated, site} from "./lib/site";

const REDUCED_MOTION_INTRO_DELAY_MS = 120;
const REPLAY_INTRO_EVENT = "malabar:replay-intro";
const HERO_FOOTER_SCROLL_THRESHOLD = 4;
export type HomeCmsContent = {
  heroEyebrow?: string;
  heroHeading?: string;
  heroText?: string;
  heroImage?: {url: string; alt: string};
  heroPrimaryLink?: {label: string; href: string};
  heroSecondaryLink?: {label: string; href: string};
  overviewEyebrow?: string;
  overviewHeading?: string;
  overviewText?: string;
  menuEyebrow?: string;
  menuHeading?: string;
  menuText?: string;
  reservationEyebrow?: string;
  reservationHeading?: string;
  reservationText?: string;
  reservationPrimaryLink?: {label: string; href: string};
  reservationSecondaryLink?: {label: string; href: string};
  mapUrl?: string;
  mapEmbedUrl?: string;
  coordinates?: {latitude: number; longitude: number};
  testimonials?: TestimonialRecord[];
};

function CompassMark() {
  return (
    <svg aria-hidden="true" className="compass" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="19.5" />
      <path d="M22 6v32M6 22h32" />
      <path className="compassNeedle" d="m22 10 3.2 9L22 34l-3.2-15L22 10Z" />
    </svg>
  );
}

export function HomeExperience({content, menuItems, dailySpecials, bookingSettings, schedule}: {content: HomeCmsContent; menuItems: MenuItem[]; dailySpecials: DailySpecial[]; bookingSettings: BookingSettings; schedule: RestaurantSchedule}) {
  const [introActive, setIntroActive] = useState(true);
  const [heroFooterRevealed, setHeroFooterRevealed] = useState(false);
  const latitude = content.coordinates?.latitude ?? site.geo.latitude;
  const longitude = content.coordinates?.longitude ?? site.geo.longitude;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion || !introActive) return;

    const introTimer = window.setTimeout(
      () => setIntroActive(false),
      REDUCED_MOTION_INTRO_DELAY_MS,
    );

    return () => window.clearTimeout(introTimer);
  }, [introActive]);

  useEffect(() => {
    const replayIntro = () => {
      setIntroActive(true);
      setHeroFooterRevealed(false);
    };
    window.addEventListener(REPLAY_INTRO_EVENT, replayIntro);
    return () => window.removeEventListener(REPLAY_INTRO_EVENT, replayIntro);
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > HERO_FOOTER_SCROLL_THRESHOLD) setHeroFooterRevealed(true);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <main
      className={`homePage ${introActive ? "introActive" : "introComplete"}`}
      aria-busy={introActive}
    >
      <section className="hero" aria-labelledby="hero-title">
      {introActive && (
        <div
          className="intro"
          role="status"
          aria-label="Welcoming you to Malabar Coast"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && event.animationName === "introExit") {
              setIntroActive(false);
            }
          }}
        >
          <div className="introScene" aria-hidden="true" />
          <div className="introBokeh" aria-hidden="true" />
          <div className="introShade" aria-hidden="true" />
          <div className="introKicker" aria-hidden="true">
            <span>Indian Cuisine &amp; Bar</span>
            <i />
            <span>Holytown, Scotland</span>
          </div>
          <div className="introLogo" aria-hidden="true">
            <Image
              src="/malabar af.svg"
              alt=""
              width={2383}
              height={2402}
              priority
            />
          </div>
          <p className="introTagline" aria-hidden="true">From one coast. To another.</p>
          <div className="introRule" aria-hidden="true" />
          <div className="introCoordinates" aria-hidden="true">
            <span>11.2588° N</span>
            <b>Malabar</b>
            <i />
            <b>Scotland</b>
            <span>55.8207° N</span>
          </div>
          <button
            className="skipIntro"
            type="button"
            onClick={() => setIntroActive(false)}
          >
            Skip intro
          </button>
        </div>
      )}

      <div className="heroImage" aria-hidden="true">
        <Image
          src={content.heroImage?.url || "/malabar-restaurant-hero-v2.jpg"}
          alt={content.heroImage?.alt || ""}
          fill
          sizes="100vw"
          priority
        />
      </div>
      <div className="seaShimmer" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <section className="heroContent" id="top" aria-labelledby="hero-title">
        <div className="eyebrow">
          <span>{content.heroEyebrow?.split(" · ")[0] || "Indian Cuisine & Bar"}</span>
          <i aria-hidden="true" />
          <span>{content.heroEyebrow?.split(" · ").slice(1).join(" · ") || "Holytown · Scotland"}</span>
        </div>

        {content.heroHeading ? <h1 id="hero-title"><span>{content.heroHeading}</span></h1> : <h1 id="hero-title">
          <span>Shaped by sea.</span>
          <span className="indent">Grounded</span>
          <span>in land.</span>
        </h1>}

        <div className="storyNote">
          <CompassMark />
          <div>
            <p>
              {content.heroText || "Tandoor fire, fragrant biriyani, rich curries and Malabar coastal flavours, served with a full bar in the heart of Holytown."}
            </p>
            <div className="heroActions">
              <Link href={content.heroPrimaryLink?.href || "/menu"}>{content.heroPrimaryLink?.label || "Explore the menu"} <span aria-hidden="true">↗</span></Link>
              <Link href={content.heroSecondaryLink?.href || "/book-a-table"}>{content.heroSecondaryLink?.label || "Book your table"} <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={`heroFooter ${heroFooterRevealed ? "" : "heroFooterHidden"}`} aria-hidden={!heroFooterRevealed}>
        <div className="chapter">
          <span>Chapter I</span>
          <strong>The coast that changed the table</strong>
        </div>
        <div className="scrollCue" aria-hidden="true">
          <span>Begin the voyage</span>
          <i><b /></i>
        </div>
        <div className="year">
          <span>Est.</span>
          <strong>MMXXVI</strong>
        </div>
      </footer>
      </section>

      <section className="homeOverview" aria-labelledby="home-overview-title">
        <div className="homeOverviewMeta">
          <span>{content.overviewEyebrow || "Malabar Coast · In brief"}</span>
          <time dateTime={pageLastUpdated["/"]}>Last reviewed {formatPublicDate(pageLastUpdated["/"])}</time>
        </div>
        <div className="homeOverviewLead">
          <h2 id="home-overview-title">{content.overviewHeading || <>What is<br />Malabar Coast?</>}</h2>
          <div>
            {(content.overviewText ? content.overviewText.split(/\n\s*\n/) : [...malabarCoastIntroduction]).map((paragraph)=><p key={paragraph}>{paragraph}</p>)}
            <Link href="/faq">Restaurant questions answered <span aria-hidden="true">↗</span></Link>
            <Link href="/hall">Discover the private hall <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <dl className="homeOverviewFacts">
          <div><dt>Cuisine &amp; bar</dt><dd>Indian tandoor dishes, curries, biriyani and Malabar coastal cooking</dd></div>
          <div><dt>Good to know</dt><dd>Vegetarian choices; ask about vegan and allergen needs</dd></div>
          <div><dt>Ways to enjoy</dt><dd>Dine in, collect or order delivery</dd></div>
          <div><dt>Catering &amp; events</dt><dd>Tailored catering for private celebrations in our flexible hall</dd></div>
        </dl>
      </section>

      <HomeSignatures items={menuItems} specials={dailySpecials} eyebrow={content.menuEyebrow} heading={content.menuHeading} introduction={content.menuText} />
      <OpeningHours schedule={schedule}/>

      <section className="homeBooking" id="book-your-table" aria-labelledby="home-booking-title">
        <div className="homeBookingIntro">
          <span>Book your table · Holytown</span>
          <h2 id="home-booking-title">A seat in<br />the story.</h2>
          <p>Choose your date, arrival time and party size right here. We check live capacity and the restaurant calendar before your table is confirmed.</p>
          <nav aria-label="Book your table and explore">
            <Link href="/menu">Browse the menu <span aria-hidden="true">↗</span></Link>
            <Link href="/offers">See current offers <span aria-hidden="true">↗</span></Link>
            <Link href="/hall">Catering or a gathering? <span aria-hidden="true">↗</span></Link>
            <Link href="/book-a-table">Open the full booking page <span aria-hidden="true">→</span></Link>
          </nav>
        </div>
        <div className="homeBookingForm"><TableBookingForm settings={bookingSettings} schedule={schedule} compact /></div>
      </section>

      <HomeStoryScroll />

      <HomeTestimonials records={content.testimonials} />

      <footer className="homeReservations" id="reservations" aria-labelledby="reservations-title">
        <div className="homeReservationsMeta">
          <span>{content.reservationEyebrow || "Book your table"}</span>
          <span>Holytown · Scotland</span>
        </div>
        <div className="homeReservationsGrid">
          <h2 id="reservations-title">{content.reservationHeading || <>Your table<br />by the coast.</>}</h2>
          <div>
            <p>
              {content.reservationText || "Join us at 33 Main Street for Southern Indian coastal cooking, warm hospitality, and a table shaped by the journey from Malabar to Scotland."}
            </p>
            <div className="homeReservationsActions">
              <Link href={content.reservationPrimaryLink?.href || "/book-a-table"}>{content.reservationPrimaryLink?.label || "Book your table"} <span aria-hidden="true">→</span></Link>
              <Link href={content.reservationSecondaryLink?.href || "/menu"}>{content.reservationSecondaryLink?.label || "Explore the menu"} <span aria-hidden="true">↗</span></Link>
              <Link href="/hall">See the private hall <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
        <div className="homeReservationsLocation">
          <div className="homeReservationsMap">
            <iframe
              src={content.mapEmbedUrl || site.maps.embedUrl}
              width="600"
              height="450"
              title="Map showing Malabar Coast at 33 Main Street in Holytown"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <span aria-hidden="true">Map · Holytown</span>
          </div>
          <div className="homeReservationsLocationCopy">
            <p>Find the table</p>
            <h3>33 Main Street</h3>
            <address>
              Holytown<br />
              North Lanarkshire · ML1 4TH
            </address>
            <div className="homeReservationsCoordinates" aria-label="Restaurant coordinates">
              <span>{Math.abs(latitude).toFixed(4)}° {latitude >= 0 ? "N" : "S"}</span>
              <i aria-hidden="true" />
              <span>{Math.abs(longitude).toFixed(4)}° {longitude >= 0 ? "E" : "W"}</span>
            </div>
            <a href={content.mapUrl || site.maps.directionsUrl} target="_blank" rel="noreferrer">
              Get Directions <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
