import type {Metadata} from "next";
import Link from "next/link";
import {listCareers} from "../lib/career-store";
import {careerSlug} from "../lib/careers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Careers",
  description: "Explore current job opportunities at Malabar Coast Cuisine & Bar in Holytown.",
  alternates: {canonical: "/careers"},
};

export default async function CareersPage() {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
  const jobs = (await listCareers()).filter((item) => item.status === "published" && (!item.closingDate || item.closingDate >= today));

  return <main className="careersPage">
    <header className="careersHero">
      <p>Malabar Coast · Holytown</p>
      <h1>Make room<br/>for your next chapter.</h1>
      <span>Join a team shaped by generous hospitality and a menu that travels from tandoor fire to the Malabar coast.</span>
    </header>
    <section className="careersBody">
      <div className="careersIntro">
        <p>Work with us</p>
        <h2>Current opportunities.</h2>
        <span>Open a role to read the full details, then apply using the contact shown on that vacancy.</span>
      </div>
      {jobs.length ? <div className="careersList">{jobs.map((job) => {
        const href = `/careers/${careerSlug(job)}`;
        return <article className="careerCard" key={job.id}>
          <div className="careerCardHeading"><div><p>{job.team || "Malabar Coast team"}</p><h3><Link href={href}>{job.title}</Link></h3></div><span>{job.employmentType}</span></div>
          <p className="careerSummary">{job.summary}</p>
          <dl><div><dt>Location</dt><dd>{job.location}</dd></div>{job.hours && <div><dt>Hours</dt><dd>{job.hours}</dd></div>}{job.pay && <div><dt>Pay</dt><dd>{job.pay}</dd></div>}{job.closingDate && <div><dt>Apply by</dt><dd>{job.closingDate}</dd></div>}</dl>
          <Link className="careerApply" href={href}>View full role <span aria-hidden="true">→</span></Link>
        </article>;
      })}</div> : <div className="careersEmpty"><h3>No open roles right now.</h3><p>Please check back for new opportunities.</p><Link href="/restaurant">Explore the restaurant <span aria-hidden="true">↗</span></Link></div>}
    </section>
  </main>;
}
