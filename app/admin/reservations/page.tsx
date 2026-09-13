import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {getBookingSettings, listReservations} from "../../lib/booking-store";
import {minutes, reservationStatuses, timeFromMinutes, type BookingSettings, type TableReservation} from "../../lib/bookings";
import { isRegularClosureDate } from "../../lib/restaurant-schedule";
import {adminCan} from "../../lib/admin-permissions";
import {AdminFrame, AdminPageHeader, EmptyState, MetricCard} from "../components/admin-ui";
import {AdminDeleteButton} from "../components/admin-delete-button";

export const dynamic = "force-dynamic";

function ReservationFields({item, settings}: {item?: TableReservation; settings: BookingSettings}) {
  return <div className="adminRecordGrid">
    <label>Name<input name="name" required maxLength={100} defaultValue={item?.name}/></label>
    <label>Email<input name="email" type="email" required maxLength={160} defaultValue={item?.email}/></label>
    <label>Phone<input name="phone" type="tel" required maxLength={40} defaultValue={item?.phone}/></label>
    <label>Date<input name="bookingDate" type="date" required defaultValue={item?.bookingDate}/></label>
    <label>Start time<input name="startTime" type="time" required defaultValue={item?.startTime || settings.firstSitting}/></label>
    <label>End time<input name="endTime" type="time" required defaultValue={item?.endTime || timeFromMinutes(minutes(settings.firstSitting) + settings.sittingMinutes)}/></label>
    <label>Party size<input name="partySize" type="number" min="1" max="100" required defaultValue={item?.partySize || settings.minimumPartySize}/></label>
    <label>Status<select name="status" defaultValue={item?.status || "confirmed"}>{reservationStatuses.map((status)=><option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></label>
    <label>Occasion<input name="occasion" maxLength={80} defaultValue={item?.occasion}/></label>
    <label>Dietary requirements<textarea name="dietaryRequirements" maxLength={400} defaultValue={item?.dietaryRequirements}/></label>
    <label>Accessibility needs<textarea name="accessibilityNeeds" maxLength={400} defaultValue={item?.accessibilityNeeds}/></label>
    <label>Guest notes<textarea name="notes" maxLength={600} defaultValue={item?.notes}/></label>
    <label className="adminRecordWide">Staff notes<textarea name="adminNotes" maxLength={1000} defaultValue={item?.adminNotes}/></label>
  </div>;
}

function updateMessage(value?: string) {
  if (value === "created") return "Reservation created in the admin register.";
  if (value === "deleted") return "Reservation deleted from the active register.";
  if (value === "success") return "Reservation updated.";
  if (value === "capacity") return "That change would exceed the available seats for an overlapping sitting.";
  if (value === "invalid") return "Check the reservation fields and try again.";
  return "That update was rejected.";
}

export default async function ReservationsAdminPage({searchParams}: {searchParams: Promise<{update?: string}>}) {
  const session = await getAdminSession("reservations:read");
  if (!session) redirect("/admin/login");
  const [settings, reservations, query] = await Promise.all([getBookingSettings(), listReservations(), searchParams]);
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
  const upcoming = reservations.filter((item) => item.bookingDate >= today && item.status === "confirmed");
  const todayBookings = upcoming.filter((item) => item.bookingDate === today);
  const mondayExceptions = upcoming.filter((item) => isRegularClosureDate(item.bookingDate));
  const todayGuests = todayBookings.reduce((sum, item) => sum + item.partySize, 0);
  const canWrite = adminCan(session.role, "reservations:write");
  const canDelete = adminCan(session.role, "reservations:delete");

  return <AdminFrame active="/admin/reservations" session={session}>
    <AdminPageHeader eyebrow="Front of house" title="Table reservations." description="Create, inspect, edit and remove table bookings without leaving the operations portal." />
    {query.update && <p className={`adminAlert ${["success", "created", "deleted"].includes(query.update) ? "isSuccess" : "isError"}`}>{updateMessage(query.update)}</p>}
    {mondayExceptions.length > 0 && <p className="adminAlert isError">The restaurant is usually closed on Mondays. Review {mondayExceptions.length} confirmed Monday table{mondayExceptions.length === 1 ? "" : "s"} below as intentional exceptions or contact the guests to rearrange.</p>}
    <section className="adminMetrics"><MetricCard label="Upcoming tables" value={upcoming.length} detail="Confirmed future reservations"/><MetricCard label="Guests today" value={todayGuests} detail={`${todayBookings.length} table${todayBookings.length===1?"":"s"}`} tone={todayGuests?"attention":undefined}/><MetricCard label="Seats per sitting" value={settings.capacity} detail={`${settings.sittingMinutes}-minute table duration`}/><MetricCard label="Largest online party" value={settings.maximumPartySize} detail={`${settings.slotMinutes}-minute arrival intervals`}/></section>
    {canWrite && <section className="adminPanel"><details className="adminCreateRecord"><summary>Create a table reservation</summary><form className="adminRecordForm" method="post" action="/api/admin/reservations"><input type="hidden" name="csrf" value={session.csrfToken}/><ReservationFields settings={settings}/><button className="adminButton" type="submit">Create reservation</button></form></details></section>}
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Capacity controls</p><h2>Booking rules</h2></div><b>{settings.bookingEnabled?"Accepting bookings":"Paused"}</b></div>
      <p>Online table bookings are closed on Mondays. Staff can create a Monday reservation here for an agreed exception.</p>
      <form className="adminBookingSettings" method="post" action="/api/admin/reservations/settings">
        <input type="hidden" name="csrf" value={session.csrfToken}/><label>Total seats<input name="capacity" type="number" min="1" max="500" defaultValue={settings.capacity}/></label><label>Table duration<select name="sittingMinutes" defaultValue={settings.sittingMinutes}><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option><option value="150">150 minutes</option><option value="180">180 minutes</option></select></label><label>Arrival interval<select name="slotMinutes" defaultValue={settings.slotMinutes}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label><label>Minimum party<input name="minimumPartySize" type="number" min="1" max="20" defaultValue={settings.minimumPartySize}/></label><label>Maximum party<input name="maximumPartySize" type="number" min="1" max="100" defaultValue={settings.maximumPartySize}/></label><label>First sitting<input name="firstSitting" type="time" defaultValue={settings.firstSitting}/></label><label>Last sitting<input name="lastSitting" type="time" defaultValue={settings.lastSitting}/></label><label>Minimum notice (minutes)<input name="minimumLeadMinutes" type="number" min="0" max="10080" defaultValue={settings.minimumLeadMinutes}/></label><label>Book ahead (days)<input name="advanceDays" type="number" min="1" max="365" defaultValue={settings.advanceDays}/></label><label className="adminCheckField"><input name="bookingEnabled" type="checkbox" defaultChecked={settings.bookingEnabled}/>Online table booking enabled</label><button className="adminButton" disabled={!canWrite}>Save booking rules</button>
      </form>
    </section>
    <section className="adminPanel"><div className="adminPanelHeading"><div><p>Guest list</p><h2>Upcoming and recent</h2></div><span>{reservations.length} active record{reservations.length===1?"":"s"}</span></div>
      {!reservations.length?<EmptyState title="No table reservations" detail="Confirmed customer bookings will appear here."/>:<div className="adminTableWrap"><table className="adminOrdersTable"><thead><tr><th>Reference</th><th>Date &amp; time</th><th>Guest</th><th>Party</th><th>Requirements</th><th>Status</th><th>Action</th></tr></thead><tbody>{reservations.map((item)=><tr key={item.id}><td><strong>{item.reference}</strong><small>{item.createdAt.slice(0,10)}</small></td><td><strong>{item.bookingDate}</strong><small>{item.startTime} to {item.endTime}</small></td><td><strong>{item.name}</strong><small>{item.phone} · {item.email}</small></td><td><strong>{item.partySize}</strong><small>{item.occasion||"No occasion"}</small></td><td><strong>{item.dietaryRequirements||"None noted"}</strong><small>{item.accessibilityNeeds||item.notes||"No other requirements"}</small></td><td><span className={`adminStatus booking_${item.status}`}>{item.status.replace("_"," ")}</span></td><td><div className="adminEntryActions">{canWrite&&<details className="adminEditRecord"><summary>Edit</summary><form className="adminRecordForm" action={`/api/admin/reservations/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><ReservationFields item={item} settings={settings}/><button className="adminButton" type="submit">Save full record</button></form></details>}{canDelete&&<form action={`/api/admin/reservations/${item.id}`} method="post"><input type="hidden" name="csrf" value={session.csrfToken}/><input type="hidden" name="action" value="delete"/><AdminDeleteButton confirmMessage={`Delete reservation ${item.reference}? This removes it from the active register.`}/></form>}</div></td></tr>)}</tbody></table></div>}
    </section>
  </AdminFrame>;
}
