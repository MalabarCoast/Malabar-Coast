import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {listHallEnquiries} from "../../lib/booking-store";
import {hallEnquiryStatuses, type HallEnquiry} from "../../lib/bookings";
import {adminCan} from "../../lib/admin-permissions";
import {AdminFrame, AdminPageHeader, EmptyState, MetricCard} from "../components/admin-ui";
import {AdminDeleteButton} from "../components/admin-delete-button";

export const dynamic = "force-dynamic";

function HallFields({item}: {item?: HallEnquiry}) {
  return <div className="adminRecordGrid">
    <label>Name<input name="name" required maxLength={100} defaultValue={item?.name}/></label>
    <label>Email<input name="email" type="email" required maxLength={160} defaultValue={item?.email}/></label>
    <label>Phone<input name="phone" type="tel" required maxLength={40} defaultValue={item?.phone}/></label>
    <label>Preferred date<input name="preferredDate" type="date" required defaultValue={item?.preferredDate}/></label>
    <label>Preferred time<input name="preferredTime" maxLength={40} defaultValue={item?.preferredTime}/></label>
    <label>Alternative date<input name="alternativeDate" type="date" defaultValue={item?.alternativeDate}/></label>
    <label>Estimated guests<input name="guestCount" type="number" min="1" max="500" defaultValue={item?.guestCount ?? ""}/></label>
    <label>Occasion<input name="occasion" maxLength={100} defaultValue={item?.occasion}/></label>
    <label>Contact preference<select name="contactPreference" defaultValue={item?.contactPreference || "phone"}><option value="phone">Phone</option><option value="email">Email</option></select></label>
    <label>Status<select name="status" defaultValue={item?.status || "new"}>{hallEnquiryStatuses.map((status)=><option key={status} value={status}>{status}</option>)}</select></label>
    <label className="adminRecordWide">Event details<textarea name="message" required maxLength={1000} defaultValue={item?.message}/></label>
    <label className="adminRecordWide">Staff notes<textarea name="adminNotes" maxLength={1000} defaultValue={item?.adminNotes}/></label>
  </div>;
}

function updateMessage(value?: string) {
  if (value === "created") return "Hall enquiry created in the admin register.";
  if (value === "deleted") return "Hall enquiry deleted from the active register.";
  if (value === "success") return "Hall enquiry updated.";
  if (value === "decision-sent") return "Hall decision saved and the guest was emailed.";
  if (value === "email-sent") return "Hall decision email sent to the guest.";
  if (value === "email-failed") return "The hall decision was saved, but the email could not be delivered. Check email setup and retry from this record.";
  if (value === "decline-first") return "Change this approved enquiry to declined so the guest receives an update before removing it.";
  if (value === "invalid") return "Check the hall enquiry fields and try again.";
  return "That update was rejected.";
}

export default async function HallEnquiriesAdminPage({searchParams}:{searchParams:Promise<{update?:string}>}) {
  const session=await getAdminSession("hall:read");
  if(!session) redirect("/admin/login");
  const [items,query]=await Promise.all([listHallEnquiries(),searchParams]);
  const canWrite=adminCan(session.role,"hall:write");
  const canDelete=adminCan(session.role,"hall:delete");
  return <AdminFrame active="/admin/hall-enquiries" session={session}>
    <AdminPageHeader eyebrow="Private events" title="Hall enquiries." description="Create, review, fully edit and remove private-event requests in one place."/>
    {query.update&&<p className={`adminAlert ${["success","created","deleted","decision-sent","email-sent"].includes(query.update)?"isSuccess":"isError"}`}>{updateMessage(query.update)}</p>}
    <section className="adminMetrics"><MetricCard label="New requests" value={items.filter(i=>i.status==="new").length} detail="Need first contact" tone={items.some(i=>i.status==="new")?"attention":undefined}/><MetricCard label="In discussion" value={items.filter(i=>i.status==="contacted").length} detail="Contact has started"/><MetricCard label="Approved" value={items.filter(i=>i.status==="approved").length} detail="Accepted by the team"/><MetricCard label="Total enquiries" value={items.length} detail="All recorded requests"/></section>
    {canWrite&&<section className="adminPanel"><details className="adminCreateRecord"><summary>Create a hall enquiry</summary><form className="adminRecordForm" action="/api/admin/hall-enquiries" method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><HallFields/><button className="adminButton" type="submit">Create hall enquiry</button></form></details></section>}
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Request register</p><h2>Every hall enquiry</h2></div><span>Newest first</span></div>{!items.length?<EmptyState title="No hall enquiries" detail="Requests from the public hall page will appear here."/>:<div className="adminTableWrap"><table className="adminOrdersTable"><thead><tr><th>Reference</th><th>Preferred date</th><th>Customer</th><th>Plan</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.reference}</strong><small>{item.createdAt.slice(0,10)}</small></td><td><strong>{item.preferredDate}</strong><small>{item.preferredTime||"Time flexible"}{item.alternativeDate?` · Alt ${item.alternativeDate}`:""}</small></td><td><strong>{item.name}</strong><small>{item.phone} · {item.email}</small></td><td><strong>{item.occasion||"Private event"}</strong><small>{item.guestCount?`${item.guestCount} guests · `:""}{item.message}</small></td><td><strong>{item.contactPreference}</strong><small>Preferred contact method</small></td><td><span className={`adminStatus hall_${item.status}`}>{item.status}</span></td><td><div className="adminEntryActions">{canWrite&&<details className="adminEditRecord"><summary>Edit</summary><form className="adminRecordForm" action={`/api/admin/hall-enquiries/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><HallFields item={item}/><button className="adminButton" type="submit">Save full record</button></form></details>}{canWrite&&["approved","declined"].includes(item.status)&&<form action={`/api/admin/hall-enquiries/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><input type="hidden" name="action" value="resend-decision"/><button className="adminTextButton" type="submit">Retry email</button></form>}{canDelete&&<form action={`/api/admin/hall-enquiries/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><input type="hidden" name="action" value="delete"/><AdminDeleteButton confirmMessage={`Delete hall enquiry ${item.reference}? This removes it from the active register.`}/></form>}</div></td></tr>)}</tbody></table></div>}</section>
  </AdminFrame>;
}
