import {redirect} from "next/navigation";
import Link from "next/link";
import {getAdminSession} from "../../lib/admin-auth";
import {listCareers} from "../../lib/career-store";
import {careerSlug, type CareerOpportunity} from "../../lib/careers";
import {AdminDeleteButton} from "../components/admin-delete-button";
import {AdminFrame, AdminPageHeader, EmptyState} from "../components/admin-ui";

export const dynamic = "force-dynamic";

function CareerFields({item}: {item?: CareerOpportunity}) {
  return <div className="adminRecordGrid">
    {item && <input type="hidden" name="id" value={item.id}/>}<label>Role title<input name="title" maxLength={120} defaultValue={item?.title} required/></label><label>Public URL slug<input name="slug" maxLength={96} defaultValue={item?.slug} placeholder="front-of-house-team-member" pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label><label>Team or department<input name="team" maxLength={80} defaultValue={item?.team}/></label><label>Location<input name="location" maxLength={120} defaultValue={item?.location || "Holytown, Scotland"} required/></label><label>Employment type<input name="employmentType" maxLength={80} defaultValue={item?.employmentType} placeholder="Full-time, part-time or casual" required/></label><label>Hours or shifts<input name="hours" maxLength={100} defaultValue={item?.hours}/></label><label>Pay display text<input name="pay" maxLength={120} defaultValue={item?.pay}/><small>Used only when minimum and maximum salary are left empty.</small></label><label>Minimum salary<input type="number" name="salaryMin" min="0" step="0.01" defaultValue={item?.salaryMin ?? ""}/></label><label>Maximum salary<input type="number" name="salaryMax" min="0" step="0.01" defaultValue={item?.salaryMax ?? ""}/></label><label>Salary currency<input name="salaryCurrency" maxLength={3} defaultValue={item?.salaryCurrency || "GBP"}/></label><label>Salary period<select name="salaryUnit" defaultValue={item?.salaryUnit || "HOUR"}><option value="HOUR">Hour</option><option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option><option value="YEAR">Year</option></select></label><label>Application email<input type="email" name="applicationEmail" maxLength={160} defaultValue={item?.applicationEmail} required/></label><label>Closing date<input type="date" name="closingDate" defaultValue={item?.closingDate}/></label><label>Status<select name="status" defaultValue={item?.status || "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label><label className="adminRecordWide">Role overview<textarea name="summary" required maxLength={1000} rows={4} defaultValue={item?.summary}/></label><label className="adminRecordWide">Responsibilities, one per line<textarea name="responsibilities" maxLength={4000} rows={6} defaultValue={item?.responsibilities}/></label><label className="adminRecordWide">Skills and experience, one per line<textarea name="skills" required maxLength={4000} rows={6} defaultValue={item?.skills}/></label><label className="adminRecordWide">Benefits, one per line<textarea name="benefits" maxLength={2000} rows={4} defaultValue={item?.benefits}/></label>
  </div>;
}

export default async function CareersAdminPage({searchParams}: {searchParams: Promise<{update?: string}>}) {
  const session = await getAdminSession("content:write");
  if (!session) redirect("/admin/login");
  const [items, query] = await Promise.all([listCareers(), searchParams]);
  const success = query.update === "saved" || query.update === "deleted";
  const updateMessage = query.update === "saved" ? "Job opportunity saved." : query.update === "deleted" ? "Job opportunity removed from the active register." : query.update === "setup" ? "The careers database update must be applied before this action is available." : "The job action could not be completed. Check the details and try again.";
  return <AdminFrame active="/admin/careers" session={session}><AdminPageHeader eyebrow="People and hiring" title="Career opportunities." description="Create, edit, preview, publish, close and remove job postings. Drafts stay private."/>
    {query.update && <p className={`adminAlert ${success ? "isSuccess" : "isError"}`}>{updateMessage}</p>}
    <section className="adminPanel"><details className="adminCreateRecord"><summary>Post a job opportunity</summary><form className="adminRecordForm" method="post" action="/api/admin/careers"><input type="hidden" name="csrf" value={session.csrfToken}/><CareerFields/><button className="adminButton">Save opportunity</button></form></details></section>
    <section className="adminPanel">
      <div className="adminPanelHeading"><div><p>Roles</p><h2>Current register</h2></div><span>{items.length} recorded</span></div>
      {items.length ? <div className="careerAdminList">{items.map((item) =>
        <article className="careerAdminRecord" key={item.id}>
          <div className="careerAdminRecordInfo">
            <strong>{item.title}</strong>
            <span>{item.status} · {item.location} · {item.employmentType}</span>
          </div>
          <div className="careerAdminRecordControls" role="group" aria-label={`Actions for ${item.title}`}>
            {item.status === "published" && <Link className="adminTextButton" href={`/careers/${careerSlug(item)}`} target="_blank" rel="noreferrer">Preview</Link>}
            <details className="adminEditRecord">
              <summary><span className="careerAdminEditLabel">Edit</span><span className="careerAdminCloseLabel">Close</span></summary>
              <div className="careerAdminDialog" role="dialog" aria-modal="true" aria-label={`Edit ${item.title}`}>
                <div className="careerAdminActions">
                  <strong>Editing {item.title}</strong>
                  {item.status === "published" && <Link className="adminTextButton" href={`/careers/${careerSlug(item)}`} target="_blank" rel="noreferrer">Preview public vacancy ↗</Link>}
                  <form method="post" action={`/api/admin/careers/${item.id}`}>
                    <input type="hidden" name="csrf" value={session.csrfToken}/>
                    <input type="hidden" name="action" value="delete"/>
                    <AdminDeleteButton confirmMessage={`Delete ${item.title}? It will immediately disappear from the careers page and active register. An audit record will be retained.`}/>
                  </form>
                </div>
                <form className="adminRecordForm" method="post" action="/api/admin/careers">
                  <input type="hidden" name="csrf" value={session.csrfToken}/>
                  <CareerFields item={item}/>
                  <button className="adminButton">Save changes</button>
                </form>
              </div>
            </details>
            <form method="post" action={`/api/admin/careers/${item.id}`}>
              <input type="hidden" name="csrf" value={session.csrfToken}/>
              <input type="hidden" name="action" value="delete"/>
              <AdminDeleteButton confirmMessage={`Delete ${item.title}? It will immediately disappear from the careers page and active register. An audit record will be retained.`}/>
            </form>
          </div>
        </article>
      )}</div> : <EmptyState title="No roles yet" detail="Create a draft, then publish it when the details are ready."/>}
    </section>
  </AdminFrame>;
}
