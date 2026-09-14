import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {createReservationFromAdmin, getBookingSettings} from "../../../lib/booking-store";
import {BookingValidationError, validateAdminReservation} from "../../../lib/bookings";
import {notifyReservation} from "../../../lib/email/notifications";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("reservations:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  try {
    const form = await readLimitedFormData(request, 32_000);
    if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
    const settings = await getBookingSettings();
    const created = await createReservationFromAdmin(validateAdminReservation(Object.fromEntries(form), settings), session.userId);
    if (created?.status === "confirmed") await notifyReservation(created);
    return NextResponse.redirect(new URL(`/admin/reservations?update=${created ? "created" : "rejected"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof BookingValidationError ? "invalid" : error instanceof Error && error.message.includes("CAPACITY_EXCEEDED") ? "capacity" : "rejected";
    return NextResponse.redirect(new URL(`/admin/reservations?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
