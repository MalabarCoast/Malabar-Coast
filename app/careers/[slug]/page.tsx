import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {JsonLd} from "../../components/json-ld";
import {getCareerBySlug} from "../../lib/career-store";
import {careerApplicationMailto, careerPayLabel} from "../../lib/careers";
import {absoluteUrl} from "../../lib/site";

export const dynamic = "force-dynamic";

function lines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function todayInLondon() {
  return new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
}

function publishedAndOpen(job: Awaited<ReturnType<typeof getCareerBySlug>>) {
  return Boolean(job && job.status === "published" && (!job.closingDate || job.closingDate >= todayInLondon()));
}

function schemaEmploymentType(value: string) {
  const normalised = value.toLowerCase();
  if (normalised.includes("part")) return "PART_TIME";
  if (normalised.includes("full")) return "FULL_TIME";
  if (normalised.includes("temporary") || normalised.includes("seasonal")) return "TEMPORARY";
  if (normalised.includes("intern")) return "INTERN";
  if (normalised.includes("contract")) return "CONTRACTOR";
  return "OTHER";
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}): Promise<Metadata> {
  const {slug} = await params;
  const job = await getCareerBySlug(slug);
  if (!publishedAndOpen(job) || !job) return {title: "Role not available", robots: {index: false, follow: false}};
  const description = job.summary.slice(0, 155);
  return {
    title: `${job.title} in ${job.location}`,
    description,
    alternates: {canonical: `/careers/${slug}`},
    openGraph: {type: "website", url: `/careers/${slug}`, title: `${job.title} | Malabar Coast Careers`, description, images: ["/restaurant/dining-room.png"]},
  };
}

export default async function CareerDetailPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const job = await getCareerBySlug(slug);
  if (!publishedAndOpen(job) || !job) notFound();

  const salaryMin = job.salaryMin ?? null;
  const salaryMax = job.salaryMax ?? null;
  const pay = careerPayLabel(job);
  const applicationHref = careerApplicationMailto(job);
  const jobSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${absoluteUrl(`/careers/${slug}`)}#job`,
    title: job.title,
    description: [job.summary, job.responsibilities, job.skills, job.benefits].filter(Boolean).join("\n\n"),
    identifier: {"@type": "PropertyValue", name: "Malabar Coast", value: job.id},
    datePosted: job.createdAt,
    validThrough: job.closingDate ? `${job.closingDate}T23:59:59+01:00` : undefined,
    employmentType: schemaEmploymentType(job.employmentType),
    directApply: true,
    url: absoluteUrl(`/careers/${slug}`),
    hiringOrganization: {"@type": "Organization", name: "Malabar Coast", sameAs: absoluteUrl("/")},
    jobLocation: {"@type": "Place", address: {"@type": "PostalAddress", streetAddress: "33 Main Street", addressLocality: "Holytown", addressRegion: "North Lanarkshire", postalCode: "ML1 4TH", addressCountry: "GB"}},
    ...(salaryMin !== null || salaryMax !== null ? {baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "GBP",
      value: {"@type": "QuantitativeValue", minValue: salaryMin ?? salaryMax, maxValue: salaryMax ?? salaryMin, unitText: job.salaryUnit || "HOUR"},
    }} : {}),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {"@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/")},
      {"@type": "ListItem", position: 2, name: "Careers", item: absoluteUrl("/careers")},
      {"@type": "ListItem", position: 3, name: job.title, item: absoluteUrl(`/careers/${slug}`)},
    ],
  };

  return <main className="careersPage careerDetailPage">
    <JsonLd data={[jobSchema, breadcrumbSchema]}/>
    <header className="careersHero careerDetailHero"><div className="careersHeroInner"><Link className="careerBack" href="/careers">← All opportunities</Link><p>{job.team || "Malabar Coast team"}</p><h1>{job.title}</h1><ul className="careerMeta" aria-label="Role details"><li>{job.location}</li><li>{job.employmentType}</li>{pay && <li>{pay}</li>}{job.hours && <li>{job.hours}</li>}</ul><span>{job.summary}</span><a className="careerApply" href={applicationHref}>Apply by email <span aria-hidden="true">↗</span></a></div></header>
    <article className="careerDetail">
      {job.responsibilities && <section><h2>What you&apos;ll do</h2><ul>{lines(job.responsibilities).map((line) => <li key={line}>{line}</li>)}</ul></section>}
      <section><h2>What we&apos;re looking for</h2><ul>{lines(job.skills).map((line) => <li key={line}>{line}</li>)}</ul></section>
      {job.benefits && <section><h2>What we offer</h2><ul>{lines(job.benefits).map((line) => <li key={line}>{line}</li>)}</ul></section>}
      <footer className="careerApplyPanel"><div className="careerApplicationCopy"><h2>How to apply</h2><p>Attach your CV and include your full name, phone number, current location, availability or notice period, and a short note about your relevant experience.</p>{job.closingDate && <p>Applications close on {job.closingDate}.</p>}<small>Please do not email passport, bank or other sensitive documents at this stage.</small></div><a className="careerApply" href={applicationHref}>Open application email <span aria-hidden="true">↗</span></a></footer>
    </article>
  </main>;
}
