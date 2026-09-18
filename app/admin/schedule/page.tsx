import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {adminCan} from "../../lib/admin-permissions";
import {getRestaurantSchedule} from "../../lib/schedule-store";
import {AdminFrame, AdminPageHeader} from "../components/admin-ui";
import {ScheduleEditor} from "./schedule-editor";

export const dynamic = "force-dynamic";
export default async function SchedulePage() {
  const session = await getAdminSession("reservations:read");
  if (!session) redirect("/admin/login");
  return <AdminFrame active="/admin/schedule" session={session}><AdminPageHeader eyebrow="Restaurant calendar" title="Opening hours and exceptions." description="Edit lunch and dinner services from one calendar. The same schedule controls the website, bookings, collection and delivery; existing commitments are reviewed before saving."/><ScheduleEditor initial={await getRestaurantSchedule()} csrf={session.csrfToken} canWrite={adminCan(session.role, "reservations:write")}/></AdminFrame>;
}
