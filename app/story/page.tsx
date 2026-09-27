import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StoryCanvas } from "./story-canvas";
import { StoryTransitionLink } from "./story-transition-link";
import { JsonLd } from "../components/json-ld";
import { absoluteUrl, pageLastUpdated } from "../lib/site";
import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {ourInspirationContent} from "../lib/brand-content";

const fallbackMetadata: Metadata = {
  title: "Our Story: From Malabar to Scotland",
  description: "Follow the food story from Calicut's spice ports and Kerala's monsoon landscape to the Malabar Coast table in Holytown, Scotland.",
  alternates: { canonical: "/story" },
  openGraph: {
    type: "article",
    url: "/story",
    title: "From Malabar to Scotland | The Malabar Coast Story",
    description: "A cinematic journey through pepper, monsoon ports and the living coastal cuisine carried to Scotland.",
    images: ["/story/restaurant-kitchen-service.jpg"],
  },
};

export function generateMetadata() {
  return getMarketingPageMetadata("story", "/story", fallbackMetadata);
}

const storySchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "From Malabar to Scotland",
      description: "The food story connecting Calicut's spice coast with the Malabar Coast restaurant in Holytown.",
      image: absoluteUrl("/story/restaurant-kitchen-service.jpg"),
      mainEntityOfPage: absoluteUrl("/story"),
      datePublished: "2026-07-13",
      dateModified: pageLastUpdated["/story"],
      author: { "@id": `${absoluteUrl("/")}#restaurant` },
      publisher: { "@id": `${absoluteUrl("/")}#restaurant` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Our story", item: absoluteUrl("/story") },
      ],
    },
  ],
};

const chapters = [
  {
    number: "01",
    eyebrow: "The coast",
    title: "A gateway to the world.",
    copy: "For more than three thousand years, the ports of Malabar welcomed sailors, merchants and new ideas. Pepper left these wet shores and quietly changed kitchens across the world.",
    image: "/story/restaurant-spice-prep.jpg",
    alt: "A restaurant cook crushing black pepper and cardamom in a stone mortar during preparation",
    label: "Pepper · Prepared by hand",
    cursor: "ENTER CALICUT",
  },
  {
    number: "02",
    eyebrow: "The exchange",
    title: "Where cultures met.",
    copy: "Arabia, Rome, China and Europe arrived with the monsoon winds. What they carried home mattered; what they left behind became part of Malabar’s generous, layered table.",
    image: "/story/restaurant-service-pass.jpg",
    alt: "A cook passing a bowl of coconut fish curry to the restaurant service team",
    label: "From kitchen · To table",
    cursor: "VIEW ARCHIVE",
  },
  {
    number: "03",
    eyebrow: "The living landscape",
    title: "History, still alive.",
    copy: "From coconut-fringed sea to the rain-soaked Western Ghats, the landscape still writes the menu: pepper, cardamom, seafood, rice and the deep warmth of the coast.",
    image: "/story/restaurant-shared-table.jpg",
    alt: "Guests passing appam across a shared table of Kerala dishes",
    label: "Holytown · Shared generously",
    cursor: "FOLLOW THE RAIN",
  },
] as const;

const dishesFromTheStory = [
  {
    name: "Meen Moilee",
    link: "/menu#malabar-coast-signature",
    image: "/food/Meen Moilee.jpeg",
    alt: "Meen Moilee served at Malabar Coast",
    connection: "Kochi · Coconut",
    description: "Fish gently cooked in a mild coconut sauce with ginger and curry leaves.",
  },
  {
    name: "Indian Garlic Chilli Chicken",
    link: "/menu#chicken",
    image: "/food/indian garlic chilli chicken tikka.jpeg",
    alt: "Indian garlic chilli chicken served at Malabar Coast",
    connection: "Mumbai · Garlic and chilli",
    description: "Chicken cooked in a bold garlic and chilli sauce with aromatic spices.",
  },
  {
    name: "Aattirachi Kurumulak",
    link: "/menu#malabar-coast-signature",
    image: "/food/aatirachi kurumulak ittath.jpeg",
    alt: "Aattirachi Kurumulak with black pepper and curry leaves served at Malabar Coast",
    connection: "Kozhikode · Black pepper",
    description: "Slow-cooked lamb layered with cracked black pepper, shallots and curry leaves.",
  },
] as const;

export default async function StoryPage() {
  const cmsPage = await getMarketingPage("story");
  const inspirationSection = getPageSection(cmsPage, "story-inspiration");
  const inspirationParagraphs = portableTextToPlainText(inspirationSection?.body).split(/\n\s*\n/).filter(Boolean);
  const cmsChapters = [getPageSection(cmsPage, "story-pepper"), getPageSection(cmsPage, "story-monsoon"), getPageSection(cmsPage, "story-table")];
  const renderedChapters = chapters.map((chapter, index) => {
    const cmsChapter = cmsChapters[index];
    return cmsChapter ? {
      ...chapter,
      eyebrow: cmsChapter.eyebrow || chapter.eyebrow,
      title: cmsChapter.heading || chapter.title,
      copy: portableTextToPlainText(cmsChapter.body) || chapter.copy,
      image: cmsChapter.image?.url || chapter.image,
      alt: cmsChapter.image?.alt || chapter.alt,
    } : chapter;
  });
  return (
    <StoryCanvas>
      <JsonLd data={storySchema} />
      <a className="storySkip" href="#story-content">Skip to the story</a>

      <section className="storyFilmHero relative min-h-[100svh] overflow-hidden" aria-labelledby="story-title">
        <div className="storyFilmHeroMedia absolute inset-0">
          <Image
            className="storyFilmHeroImage object-cover"
            src={cmsPage?.heroImage?.url || "/story/restaurant-kitchen-service.jpg"}
            alt={cmsPage?.heroImage?.alt || "A restaurant cook finishing a coconut fish curry during service"}
            fill
            sizes="100vw"
            priority
          />
        </div>
        <div className="storyFilmHeroShade absolute inset-0" />
        <div className="storyFilmGrid absolute inset-0" aria-hidden="true" />

        <div className="storyFilmCopy">
          <div className="storyHeroMeta">
            <span>{cmsPage?.eyebrow || "Our story · Chapter I"}</span>
            <span>11.2588° N · 75.7804° E</span>
          </div>
          {cmsPage?.heroHeading ? <h1 id="story-title"><span className="storyHeroLine"><span>{cmsPage.heroHeading}</span></span></h1> : <h1 id="story-title">
            <span className="storyHeroLine"><span>A coast that</span></span>
            <span className="storyHeroLine storyHeroLineOffset"><span>changed</span></span>
            <span className="storyHeroLine"><span>the table.</span></span>
          </h1>}
        </div>

        <div className="storyFilmFooter">
          <span>Malabar Coast · Southern India</span>
          <div><i /><span>Scroll to follow the monsoon</span></div>
          <span>Est. in memory</span>
        </div>
      </section>

      <section className="storyManifesto" id="story-content" aria-labelledby="manifesto-title">
        <div className="storyManifestoMeta" data-reveal>
          <span>{inspirationSection?.eyebrow || ourInspirationContent.title}</span>
          <span>{inspirationSection?.heading || ourInspirationContent.subtitle}</span>
        </div>
        <h2 className="storyManifestoTitle" id="manifesto-title" aria-label="Our story">
          <span>Our</span><span>story</span>
        </h2>
        <div className="storyManifestoCopy">
          <p data-reveal>{inspirationSection?.heading || ourInspirationContent.subtitle}</p>
          <div data-reveal>
            {(inspirationParagraphs.length ? inspirationParagraphs : ourInspirationContent.paragraphs).map((paragraph)=><p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="storyAtlas" aria-label="Three chapters from the Malabar Coast">
        <div className="storyAtlasCopy">
          <div className="storyAtlasRail" aria-hidden="true"><span>01</span><i /><span>03</span></div>
          <div className="storyAtlasPanels">
            {renderedChapters.map((chapter, index) => (
              <article className="storyAtlasPanel" key={chapter.number}>
                <p>{chapter.eyebrow} · Featured chapter</p>
                <strong>{chapter.number}</strong>
                <h2>{chapter.title}</h2>
                <span>{chapter.copy}</span>
                {index === 0 ? (
                  <StoryTransitionLink className="storyChapterLink" href="/story/calicut">
                    Enter the Calicut archive <i>↗</i>
                  </StoryTransitionLink>
                ) : (
                  <Link className="storyChapterLink" href="#story-finale">
                    Continue to the table <i>↓</i>
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="storyAtlasVisuals">
          {renderedChapters.map((chapter) => (
            <figure
              className="storyAtlasScene"
              data-cursor-label={chapter.cursor}
              key={chapter.number}
            >
              <div className="storyAtlasImage">
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 1024px) 100vw, 58vw" />
                <span className="storyAtlasShade" />
              </div>
              <figcaption><span>{chapter.label}</span><span>{chapter.number} / 03</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="storyTable" aria-labelledby="story-table-title">
        <div className="storyTableIntro" data-reveal>
          <p>On our table today · The story made edible</p>
          <h2 id="story-table-title">History,<br /><em>served warm.</em></h2>
          <span>
            The old sea road is still present in the pepper, coconut and cardamom we cook with
            every day. These are three places where the journey reaches the plate.
          </span>
        </div>
        <div className="storyTableGrid">
          {dishesFromTheStory.map((dish) => (
            <Link className="storyTableDish" href={dish.link} key={dish.name} data-reveal>
              <div>
                <Image src={dish.image} alt={dish.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
              </div>
              <span>{dish.connection}</span>
              <strong>{dish.name}</strong>
              <p>{dish.description}</p>
              <i aria-hidden="true">View dish ↗</i>
            </Link>
          ))}
        </div>
      </section>

      <footer className="storyConnect storyConnectCompact" id="story-finale">
        <p data-reveal>Our story continues at the table</p>
        <h2 data-reveal>Come to<br /><em>the coast.</em></h2>
        <div className="storyConnectBottom" data-reveal>
          <span>33 Main Street · Holytown · Holytown · ML1 4TH</span>
          <Link href="/book-a-table" data-cursor-label="BOOK A TABLE">
            Reserve your table <i>↗</i>
          </Link>
        </div>
      </footer>
    </StoryCanvas>
  );
}
