import type {Metadata} from "next";
import Link from "next/link";
import {listCareers} from "../lib/career-store";
import {careerPayLabel, careerSlug} from "../lib/careers";

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
      <div className="careersHeroInner">
        <p>Careers at Malabar Coast</p>
        <h1>Join our team</h1>
        <span>Find current restaurant opportunities in Holytown and apply directly by email.</span>
      </div>
    </header>
    <section className="careersBody">
      <div className="careersIntro">
        <h2>Open positions</h2>
        <p>Select a role for the full job description and application details.</p>
      </div>
      {jobs.length ? <div className="careersList">{jobs.map((job) => {
        const href = `/careers/${careerSlug(job)}`;
        const pay = careerPayLabel(job);
        return <article className="careerCard" key={job.id}>
          <div className="careerCardHeading"><div><h3><Link href={href}>{job.title}</Link></h3><p>{job.team || "Malabar Coast team"}</p></div><span>{job.employmentType}</span></div>
          <ul className="careerMeta" aria-label="Role details"><li>{job.location}</li>{pay && <li>{pay}</li>}{job.hours && <li>{job.hours}</li>}</ul>
          <p className="careerSummary">{job.summary}</p>
          <div className="careerCardFooter">{job.closingDate && <span>Apply by {job.closingDate}</span>}<Link className="careerTextLink" href={href}>View role <span aria-hidden="true">→</span></Link></div>
        </article>;
      })}</div> : <div className="careersEmpty"><h3>No open roles right now.</h3><p>Please check back for new opportunities.</p><Link href="/restaurant">Explore the restaurant <span aria-hidden="true">↗</span></Link></div>}
    </section>
  </main>;
}
