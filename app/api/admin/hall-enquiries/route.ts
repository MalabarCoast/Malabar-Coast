import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {createHallEnquiryFromAdmin} from "../../../lib/booking-store";
import {BookingValidationError, validateAdminHallEnquiry} from "../../../lib/bookings";
import {notifyHallDecision, notifyHallEnquiry} from "../../../lib/email/notifications";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("hall:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  try {
    const form = await readLimitedFormData(request, 32_000);
    if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
    const created = await createHallEnquiryFromAdmin(validateAdminHallEnquiry(Object.fromEntries(form)), session.userId);
    if (created?.status === "new") await notifyHallEnquiry(created);
    if (created && ["approved", "declined"].includes(created.status)) await notifyHallDecision(created);
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${created ? "created" : "rejected"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof BookingValidationError ? "invalid" : "rejected";
    return NextResponse.redirect(new URL(`/admin/hall-enquiries?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
