import type {Metadata} from "next";
import Link from "next/link";
import {listCareers} from "../lib/career-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {title: "Careers", description: "Explore current job opportunities at Malabar Coast in Holytown.", alternates: {canonical: "/careers"}};
function lines(value: string) {return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);}

export default async function CareersPage() {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
  const jobs = (await listCareers()).filter((item) => item.status === "published" && (!item.closingDate || item.closingDate >= today));
  return <main className="careersPage"><header className="careersHero"><p>Malabar Coast · Holytown</p><h1>Make room<br/>for your next chapter.</h1><span>Join a team shaped by generous hospitality and the flavours of the coast.</span></header><section className="careersBody"><div className="careersIntro"><p>Work with us</p><h2>Current opportunities.</h2><span>Every role below is managed by the restaurant team. Please use the contact shown in the listing to apply.</span></div>{jobs.length ? <div className="careersList">{jobs.map((job) => <article className="careerCard" key={job.id} id={job.id}><div className="careerCardHeading"><div><p>{job.team || "Malabar Coast team"}</p><h3>{job.title}</h3></div><span>{job.employmentType}</span></div><p className="careerSummary">{job.summary}</p><dl><div><dt>Location</dt><dd>{job.location}</dd></div>{job.hours && <div><dt>Hours</dt><dd>{job.hours}</dd></div>}{job.pay && <div><dt>Pay</dt><dd>{job.pay}</dd></div>}{job.closingDate && <div><dt>Apply by</dt><dd>{job.closingDate}</dd></div>}</dl>{job.responsibilities && <section><h4>What you&apos;ll do</h4><ul>{lines(job.responsibilities).map((line) => <li key={line}>{line}</li>)}</ul></section>}<section><h4>Skills and experience</h4><ul>{lines(job.skills).map((line) => <li key={line}>{line}</li>)}</ul></section>{job.benefits && <section><h4>What we offer</h4><ul>{lines(job.benefits).map((line) => <li key={line}>{line}</li>)}</ul></section>}<a className="careerApply" href={`mailto:${job.applicationEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}>Apply by email <span aria-hidden="true">↗</span></a></article>)}</div> : <div className="careersEmpty"><h3>No open roles right now.</h3><p>Please check back for new opportunities.</p><Link href="/restaurant">Explore the restaurant <span aria-hidden="true">↗</span></Link></div>}</section></main>;
}
