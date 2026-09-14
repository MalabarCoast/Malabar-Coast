import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../../lib/admin-auth";
import {deleteHallEnquiryFromAdmin, getHallEnquiry, updateHallEnquiryFromAdmin} from "../../../../lib/booking-store";
import {BookingValidationError, validateAdminHallEnquiry} from "../../../../lib/bookings";
import {notifyHallDecision} from "../../../../lib/email/notifications";
import {configuredSiteOrigin, isTrustedOrigin, noStoreJson, readLimitedFormData} from "../../../../lib/security";

export const runtime = "nodejs";
const idPattern = /^hall_[A-Za-z0-9_-]{16,80}$/;
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getAdminSession("hall:read");
  if (!session) return noStoreJson({error: "Unauthorized"}, {status: 401});
  const {id} = await params;
  if (!idPattern.test(id)) return noStoreJson({error: "Invalid hall enquiry reference"}, {status: 400});
  const hallEnquiry = await getHallEnquiry(id);
  return hallEnquiry ? noStoreJson({hallEnquiry}) : noStoreJson({error: "Hall enquiry not found"}, {status: 404});
}
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const form = await readLimitedFormData(request, 32_000);
  const action = String(form.get("action") || "update");
  const session = await getAdminSession(action === "delete" ? "hall:delete" : "hall:write");
  if (!session || !isTrustedOrigin(request) || !verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
  const {id} = await params;
  const previous = idPattern.test(id) ? await getHallEnquiry(id) : null;
  if (action === "delete") {
    if (previous?.status === "approved") return NextResponse.redirect(new URL("/admin/hall-enquiries?update=decline-first", configuredSiteOrigin(request)), 303);
    const deleted = previous ? await deleteHallEnquiryFromAdmin(id, session.userId) : false;
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${deleted ? "deleted" : "rejected"}`, configuredSiteOrigin(request)), 303);
  }
  if (action === "resend-decision") {
    const sent = previous && ["approved", "declined"].includes(previous.status) ? await notifyHallDecision(previous) : false;
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${sent ? "email-sent" : "email-failed"}`, configuredSiteOrigin(request)), 303);
  }
  try {
    const updated = previous ? await updateHallEnquiryFromAdmin(id, validateAdminHallEnquiry(Object.fromEntries(form)), session.userId) : null;
    if (updated && updated.status !== previous?.status && ["approved", "declined"].includes(updated.status)) {
      const sent = await notifyHallDecision(updated);
      return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${sent ? "decision-sent" : "email-failed"}`, configuredSiteOrigin(request)), 303);
    }
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${updated ? "success" : "rejected"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof BookingValidationError ? "invalid" : "rejected";
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
