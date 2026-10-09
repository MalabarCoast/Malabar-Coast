import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {adminCan} from "../../lib/admin-permissions";
import {getServiceAvailability} from "../../lib/service-availability-store";
import {AdminFrame, AdminPageHeader} from "../components/admin-ui";
import {AvailabilityEditor} from "./availability-editor";

export const dynamic = "force-dynamic";

export default async function AvailabilityAdminPage() {
  const session = await getAdminSession("availability:read");
  if (!session) redirect("/admin/login");
  return <AdminFrame active="/admin/availability" session={session}>
    <AdminPageHeader eyebrow="Customer channels" title="Service controls." description="Close one or several booking and ordering channels immediately, or schedule a timed closure that reopens automatically. Existing commitments are never cancelled."/>
    <AvailabilityEditor initial={await getServiceAvailability()} csrf={session.csrfToken} canWrite={adminCan(session.role, "availability:write")}/>
  </AdminFrame>;
}
