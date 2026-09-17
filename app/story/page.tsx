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
    images: ["/og/story.png"],
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
      image: absoluteUrl("/story/calicut-spice-port.png"),
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
    image: "/story/calicut-spice-port.png",
    alt: "A rain-washed historic spice port on the Malabar Coast with an uru vessel offshore",
    label: "Calicut · Arabian Sea",
    cursor: "ENTER CALICUT",
  },
  {
    number: "02",
    eyebrow: "The exchange",
    title: "Where cultures met.",
    copy: "Arabia, Rome, China and Europe arrived with the monsoon winds. What they carried home mattered; what they left behind became part of Malabar’s generous, layered table.",
    image: "/story/pepper-balance.png",
    alt: "Peppercorns being weighed by hand on an old brass balance",
    label: "Black pepper · The black gold",
    cursor: "VIEW ARCHIVE",
  },
  {
    number: "03",
    eyebrow: "The living landscape",
    title: "History, still alive.",
    copy: "From coconut-fringed sea to the rain-soaked Western Ghats, the landscape still writes the menu: pepper, cardamom, seafood, rice and the deep warmth of the coast.",
    image: "/story/western-ghats.png",
    alt: "Pepper vines growing through the misty Western Ghats after monsoon rain",
    label: "Western Ghats · After the monsoon",
    cursor: "FOLLOW THE RAIN",
  },
] as const;

const dishesFromTheStory = [
  {
    name: "Konju Coconut Fry",
    link: "/menu#malabar-coast-signature",
    image: "/menu/calicut-pepper-prawns.png",
    alt: "A coastal prawn dish inspired by Calicut's spice coast",
    connection: "Calicut · Pepper",
    description: "Prawns tossed with toasted coconut, curry leaves and Malabar spices for a dry, savoury finish.",
  },
  {
    name: "Chicken Tikka",
    link: "/menu#clay-oven",
    image: "/menu/chicken-tikka.png",
    alt: "Charred chicken tikka with red onion and grilled lemon",
    connection: "Delhi · Tandoor fire",
    description: "Tender yoghurt-spiced chicken, charred in the tandoor for smoky edges and a juicy centre.",
  },
  {
    name: "Gulab Jamun",
    link: "/menu#desserts",
    image: "/menu/gulab-jamun.png",
    alt: "Gulab jamun in cardamom and saffron syrup",
    connection: "Lucknow · Cardamom",
    description: "Soft golden milk dumplings soaked in fragrant cardamom and saffron syrup.",
  },
] as const;

export default async function StoryPage() {
  const cmsPage = await getMarketingPage("story");
  const inspirationSection = getPageSection(cmsPage, "story-inspiration");
  const inspirationParagraphs = portableTextToPlainText(inspirationSection?.body).split(/\n\s*\n/).filter(Boolean);
  const cmsChapters = [getPageSection(cmsPage, "story-pepper"), getPageSection(cmsPage, "story-monsoon")];
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
            src={cmsPage?.heroImage?.url || "/story/calicut-spice-port.png"}
            alt={cmsPage?.heroImage?.alt || "A rain-washed historic spice port on the Malabar Coast"}
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
                <Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 900px) 100vw, 58vw" />
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
