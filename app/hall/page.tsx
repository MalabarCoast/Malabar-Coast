import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "../components/json-ld";
import { Reveal } from "../components/reveal";
import { HallEnquiryForm } from "../components/hall-enquiry-form";
import { absoluteUrl, formatPublicDate, pageLastUpdated, site } from "../lib/site";
import {getMarketingPage, getMarketingPageMetadata, getPageSection, portableTextToPlainText} from "@/sanity/lib/pages";
import {getFaqItems} from "@/sanity/lib/faq";

const fallbackMetadata: Metadata = {
  title: "Private Event Hall in Holytown",
  description:
    "Discover the private event hall and tailored catering service at Malabar Coast in Holytown, with a flexible open floor, built-in bar and raised stage.",
  keywords: [
    "private event hall Holytown",
    "function hall Holytown",
    "party venue North Lanarkshire",
    "private dining Holytown",
    "celebration venue Holytown",
    "restaurant hall Motherwell",
    "Malabar Coast private hall",
  ],
  alternates: { canonical: "/hall" },
  openGraph: {
    type: "website",
    url: "/hall",
    title: "Private Event Hall at Malabar Coast, Holytown",
    description: "A flexible private room with tailored catering, its own bar and a raised stage, within Malabar Coast at 33 Main Street, Holytown.",
    images: [
      {
        url: "/og/hall.jpeg",
        width: 1600,
        height: 1067,
        alt: "The private hall at Malabar Coast with an open floor and built-in wooden bar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Event Hall at Malabar Coast",
    description: "A flexible hall with a built-in bar and raised stage at Malabar Coast in Holytown.",
    images: ["/og/hall.jpeg"],
  },
};

export function generateMetadata() {
  return getMarketingPageMetadata("hall", "/hall", fallbackMetadata);
}

const fallbackHallFaqs = [
  {
    id: "hall-what-is-it",
    question: "What is the private hall at Malabar Coast?",
    answer:
      "The private hall is a flexible event space within Malabar Coast restaurant at 33 Main Street, Holytown. The room has an open floor, a built-in wooden bar and a raised stage, creating a practical setting for private celebrations and community gatherings.",
  },
  {
    id: "hall-facilities",
    question: "What facilities are visible in the hall?",
    answer:
      "The Malabar Coast hall includes a dedicated built-in bar, a raised stage, ceiling lighting and a flexible open floor. Seating and event layouts can be arranged around the room, while final capacity and package details will be published after they are confirmed.",
  },
  {
    id: "hall-occasions",
    question: "Which occasions can the hall accommodate?",
    answer:
      "The hall is presented for private celebrations, family gatherings, community occasions and small events. The open floor supports different layouts, while the bar and stage provide useful focal points. Event suitability depends on the required setup and confirmed guest capacity.",
  },
  {
    id: "hall-booking",
    question: "How can guests enquire about the hall?",
    answer:
      "Send the hall enquiry form with your preferred date, approximate guest count and the basics of your occasion. This starts a request rather than confirming the space. The restaurant team will review it and contact you to discuss availability, timing, layout, catering and pricing.",
  },
] as const;

const createHallSchema = (hallFaqs: ReadonlyArray<{id: string; question: string; answer: string}>) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EventVenue",
      "@id": `${absoluteUrl("/hall")}#venue`,
      name: "Private Event Hall at Malabar Coast",
      url: absoluteUrl("/hall"),
      description:
        "A flexible private event hall with a built-in bar and raised stage inside Malabar Coast restaurant in Holytown, North Lanarkshire.",
      image: [absoluteUrl("/Hall1.jpeg"), absoluteUrl("/Hall2.jpeg"), absoluteUrl("/Hall3.jpeg")],
      address: { "@type": "PostalAddress", ...site.address },
      geo: { "@type": "GeoCoordinates", ...site.geo },
      isPartOf: { "@id": `${site.url}/#restaurant` },
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Built-in bar", value: true },
        { "@type": "LocationFeatureSpecification", name: "Raised stage", value: true },
        { "@type": "LocationFeatureSpecification", name: "Flexible open floor", value: true },
        { "@type": "LocationFeatureSpecification", name: "Tailored event catering by enquiry", value: true },
      ],
    },
    {
      "@type": "WebPage",
      "@id": `${absoluteUrl("/hall")}#webpage`,
      url: absoluteUrl("/hall"),
      name: "Private Event Hall at Malabar Coast",
      dateModified: pageLastUpdated["/hall"],
      inLanguage: "en-GB",
      about: { "@id": `${absoluteUrl("/hall")}#venue` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Private Hall", item: absoluteUrl("/hall") },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${absoluteUrl("/hall")}#faq-schema`,
      datePublished: pageLastUpdated["/hall"],
      dateModified: pageLastUpdated["/hall"],
      mainEntity: hallFaqs.map((item) => ({
        "@type": "Question",
        "@id": `${absoluteUrl("/hall")}#${item.id}`,
        name: item.question,
        datePublished: pageLastUpdated["/hall"],
        dateModified: pageLastUpdated["/hall"],
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
});

export default async function HallPage() {
  const [cmsPage, allFaqs] = await Promise.all([getMarketingPage("hall"), getFaqItems()]);
  const cmsHallFaqs = allFaqs.filter((item) => /hall|private/i.test(`${item.category || ""} ${item.question}`));
  const hallFaqs = cmsHallFaqs.length >= 3 ? cmsHallFaqs : fallbackHallFaqs;
  const hallSchema = createHallSchema(hallFaqs);
  const introductionSection = getPageSection(cmsPage, "hall-intro");
  const stageSection = getPageSection(cmsPage, "hall-stage");
  const gallerySection = getPageSection(cmsPage, "hall-gallery");
  const occasionsSection = getPageSection(cmsPage, "hall-occasions");
  const planningSection = getPageSection(cmsPage, "hall-planning");
  const enquirySection = getPageSection(cmsPage, "hall-enquiry");
  const faqSection = getPageSection(cmsPage, "hall-faq");
  const closingSection = getPageSection(cmsPage, "hall-closing");
  return (
    <main className="editorialPage hallPage">
      <JsonLd data={hallSchema} />

      <section className="hallHero" aria-labelledby="hall-title">
        <Image
          src={cmsPage?.heroImage?.url || "/Hall1.jpeg"}
          alt={cmsPage?.heroImage?.alt || "The private hall at Malabar Coast with an open floor and built-in wooden bar"}
          fill
          sizes="100vw"
          priority
        />
        <div className="hallHeroShade" />
        <div className="hallHeroCopy">
          <p>{cmsPage?.eyebrow || "Private gatherings · Holytown"}</p>
          <h1 id="hall-title">{cmsPage?.heroHeading ? <span>{cmsPage.heroHeading}</span> : <><span>A room</span><span>of your own.</span></>}</h1>
          <div className="hallHeroActions"><Link href={cmsPage?.heroPrimaryLink?.href || "#hall-enquiry"}>{cmsPage?.heroPrimaryLink?.label || "Start your enquiry"} <span aria-hidden="true">↓</span></Link><Link href={cmsPage?.heroSecondaryLink?.href || "/book-a-table"}>{cmsPage?.heroSecondaryLink?.label || "Book a restaurant table"} <span aria-hidden="true">↗</span></Link></div>
        </div>
        <div className="heroChapterMark"><span>Bar · Stage · Flexible floor</span><i /><span>33 Main Street</span></div>
      </section>

      <section className="hallEnquiryLead" id="hall-enquiry" aria-labelledby="hall-enquiry-title">
        <div className="hallEnquiryLeadCopy">
          <Reveal className="chapterIndex">{enquirySection?.eyebrow || "Your occasion · Holytown"}</Reveal>
          <Reveal as="h2" id="hall-enquiry-title" delay={70}>{enquirySection?.heading || <>Bring people<br />together.</>}</Reveal>
          <Reveal as="p" delay={110}>{portableTextToPlainText(enquirySection?.body) || "Tell us the date, guest estimate and the kind of gathering you have in mind. Our team will check the room and contact you before anything is confirmed."}</Reveal>
          <Reveal as="ul" className="hallEnquiryPromises" delay={145}>
            {(enquirySection?.items?.length ? enquirySection.items : [
              {_key: "no-commitment", shortLabel: "01", title: "No payment or commitment at this stage"},
              {_key: "personal-confirmation", shortLabel: "02", title: "Availability confirmed personally by our team"},
              {_key: "plan-together", shortLabel: "03", title: "Layout, catering and access planned together"},
            ]).map((item, index) => <li key={item._key}><span>{item.shortLabel || String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong></li>)}
          </Reveal>
        </div>
        <Reveal className="hallEnquiryPanel hallEnquiryPanelLead" delay={120}>
          <div className="hallEnquiryPanelHeader">
            <span>Hall availability request</span>
            <strong>Start with the basics.</strong>
          </div>
          <HallEnquiryForm />
        </Reveal>
      </section>

      <section className="hallIntroduction" aria-labelledby="hall-introduction-title">
        <Reveal className="chapterIndex">{introductionSection?.eyebrow || "The private hall · 01"}</Reveal>
        <Reveal as="h2" id="hall-introduction-title" delay={70}>{introductionSection?.heading || <>Gather by<br />the coast.</>}</Reveal>
        <div>
          {introductionSection ? <Reveal as="p">{portableTextToPlainText(introductionSection.body)}</Reveal> : <>
          <Reveal as="p">
            Malabar Coast&apos;s private hall is a flexible event space within the restaurant in
            Holytown. A built-in bar, raised stage and open floor create a calm setting for
            celebrations, family gatherings and community occasions.
          </Reveal>
          <Reveal as="p" delay={90}>
            The room can move from an open reception to seated arrangements without losing its
            warm, understated character. Final capacity, packages, catering choices and pricing
            will be added when those details are confirmed.
          </Reveal>
          </>}
          <Reveal delay={140}><time dateTime={pageLastUpdated["/hall"]}>Last reviewed {formatPublicDate(pageLastUpdated["/hall"])}</time></Reveal>
        </div>
      </section>

      <section className="hallDetails" aria-label="Private hall features">
        {(introductionSection?.items?.length ? introductionSection.items : [
          {_key: "dedicated", shortLabel: "01", title: "Dedicated space", text: "A private room within the restaurant"},
          {_key: "bar", shortLabel: "02", title: "At one end", text: "A built-in wooden bar"},
          {_key: "stage", shortLabel: "03", title: "At the other", text: "A raised event stage"},
          {_key: "floor", shortLabel: "04", title: "Through the room", text: "A flexible open floor"},
        ]).map((item, index) => <Reveal delay={index * 60} key={item._key}><span>{item.shortLabel || String(index + 1).padStart(2, "0")}</span><p>{item.title}</p><strong>{item.text}</strong></Reveal>)}
      </section>

      <section className="hallOccasions" aria-labelledby="hall-occasions-title">
        <div className="hallOccasionsIntro">
          <Reveal className="chapterIndex">{occasionsSection?.eyebrow || "Made for your people · 02"}</Reveal>
          <Reveal as="h2" id="hall-occasions-title" delay={70}>{occasionsSection?.heading || <>One room.<br />Many reasons.</>}</Reveal>
          <Reveal as="p" delay={120}>{portableTextToPlainText(occasionsSection?.body) || "Shape the hall around the occasion, from a lively family celebration to a calm community gathering. Tell us what matters and we will help you find the right setup."}</Reveal>
        </div>
        <div className="hallOccasionGrid">
          {(occasionsSection?.items?.length ? occasionsSection.items.map((item,index)=>[item.shortLabel || String(index+1).padStart(2,'0'),item.title,item.text || '']) : [['01','Milestones','Birthdays, anniversaries and family celebrations'],['02','Receptions','A flexible floor for welcoming, dining and dancing'],['03','Community','Meetings, presentations and shared occasions'],['04','Private dining','A more intimate room with Malabar Coast catering']]).map(([number,title,copy],index)=><Reveal as="article" delay={index*55} key={`${number}-${title}`}><span>{number}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
        </div>
      </section>

      <section className="hallStagePortrait" aria-labelledby="hall-stage-title">
        <Reveal className="hallStageImage">
          <Image
            src={stageSection?.image?.url || "/Hall2.jpeg"}
            alt={stageSection?.image?.alt || "Wide view of the Malabar Coast event hall showing its open floor and raised stage"}
            fill
            sizes="(max-width: 860px) 100vw, 62vw"
          />
        </Reveal>
        <div className="hallStageCopy">
          <Reveal className="chapterIndex">{stageSection?.eyebrow || "The stage · 02"}</Reveal>
          <Reveal as="h2" id="hall-stage-title" delay={70}>{stageSection?.heading || <>A natural<br />focal point.</>}</Reveal>
          <Reveal as="p" delay={130}>
            {portableTextToPlainText(stageSection?.body) || "The raised stage anchors the far end of the room for speeches, presentations and moments shared together. Warm timber, a marble-toned backdrop and soft ceiling light keep the space simple enough to make your own."}
          </Reveal>
        </div>
      </section>

      <section className="hallGallery" aria-labelledby="hall-gallery-title">
        <div className="hallGalleryHeading">
          <Reveal className="chapterIndex">{gallerySection?.eyebrow || "The room · 03"}</Reveal>
          <Reveal as="h2" id="hall-gallery-title" delay={70}>{gallerySection?.heading || "Set the scene."}</Reveal>
        </div>
        <Reveal className="hallGalleryImage" delay={120}>
          <Image
            src={gallerySection?.image?.url || "/Hall3.jpeg"}
            alt={gallerySection?.image?.alt || "The raised stage in the Malabar Coast hall with chairs arranged across the floor"}
            fill
            sizes="100vw"
          />
          <span>Flexible seating · Stage view</span>
        </Reveal>
      </section>

      <section className="hallPlanning" aria-labelledby="hall-planning-title">
        <Reveal className="chapterIndex">{planningSection?.eyebrow || "From idea to occasion · 05"}</Reveal>
        <Reveal as="h2" id="hall-planning-title" delay={70}>{planningSection?.heading || <>A simple way<br />to begin.</>}</Reveal>
        <Reveal as="p" delay={110}>{portableTextToPlainText(planningSection?.body) || "No polished plan is needed. Share the date, guest estimate and the feeling you want; our team will take it from there."}</Reveal>
        <div className="hallPlanningSteps">{(planningSection?.items?.length ? planningSection.items.map((item,index)=>[item.shortLabel || String(index+1).padStart(2,'0'),item.title,item.text || '']) : [['01','Send the basics','Date, time, guest estimate and occasion.'],['02','Shape it together','Discuss layout, catering, stage and access needs.'],['03','Confirm with confidence','The team confirms availability, details and price directly.']]).map(([number,title,copy],index)=><Reveal as="article" delay={index*60} key={`${number}-${title}`}><span>{number}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}</div>
      </section>

      <section className="hallFaq" id="hall-faq" aria-labelledby="hall-faq-title">
        <div>
          <Reveal className="chapterIndex">{faqSection?.eyebrow || "Before you plan · 04"}</Reveal>
          <Reveal as="h2" id="hall-faq-title" delay={70}>{faqSection?.heading || "Good to know."}</Reveal>
        </div>
        <div className="hallFaqList">
          {hallFaqs.map((item, index) => (
            <Reveal as="article" id={item.id} key={item.id} delay={index * 55}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="hallClosing" aria-labelledby="hall-closing-title">
        <Reveal className="chapterIndex">{closingSection?.eyebrow || "See it for yourself · Holytown"}</Reveal>
        <Reveal as="h2" id="hall-closing-title" delay={70}>{closingSection?.heading || <>Come and see<br />the room.</>}</Reveal>
        <Reveal as="p" delay={120}>{portableTextToPlainText(closingSection?.body) || "Explore the location, look through the menu, or return to the enquiry above when you are ready. You do not need a finished plan to start the conversation."}</Reveal>
        <Reveal className="hallClosingActions" delay={150}>
          <a href="#hall-enquiry">Return to the enquiry <span aria-hidden="true">↑</span></a>
          <Link href="/restaurant#location">See the location <span aria-hidden="true">→</span></Link>
          <Link href="/menu">Browse catering inspiration <span aria-hidden="true">↗</span></Link>
        </Reveal>
      </section>
    </main>
  );
}
