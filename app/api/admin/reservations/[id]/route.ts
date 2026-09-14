import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../../lib/admin-auth";
import {deleteReservationFromAdmin, getBookingSettings, getReservation, updateReservationFromAdmin} from "../../../../lib/booking-store";
import {BookingValidationError, validateAdminReservation} from "../../../../lib/bookings";
import {notifyReservationCancellation} from "../../../../lib/email/notifications";
import {configuredSiteOrigin, isTrustedOrigin, noStoreJson, readLimitedFormData} from "../../../../lib/security";

export const runtime = "nodejs";
const idPattern = /^res_[A-Za-z0-9_-]{16,80}$/;
export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getAdminSession("reservations:read");
  if (!session) return noStoreJson({error: "Unauthorized"}, {status: 401});
  const {id} = await params;
  if (!idPattern.test(id)) return noStoreJson({error: "Invalid reservation reference"}, {status: 400});
  const reservation = await getReservation(id);
  return reservation ? noStoreJson({reservation}) : noStoreJson({error: "Reservation not found"}, {status: 404});
}
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const form = await readLimitedFormData(request, 32_000);
  const action = String(form.get("action") || "update");
  const permission = action === "delete" ? "reservations:delete" : "reservations:write";
  const session = await getAdminSession(permission);
  if (!session || !isTrustedOrigin(request) || !verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
  const {id} = await params;
  const previous = idPattern.test(id) ? await getReservation(id) : null;
  if (action === "resend-cancellation") {
    const delivered = previous?.status === "cancelled" ? await notifyReservationCancellation(previous) : false;
    return NextResponse.redirect(new URL(`/admin/reservations?update=${delivered ? "email-sent" : "email-failed"}`, configuredSiteOrigin(request)), 303);
  }
  if (action === "delete") {
    if (previous?.status === "confirmed") return NextResponse.redirect(new URL("/admin/reservations?update=cancel-first", configuredSiteOrigin(request)), 303);
    const deleted = previous ? await deleteReservationFromAdmin(id, session.userId) : false;
    return NextResponse.redirect(new URL(`/admin/reservations?update=${deleted ? "deleted" : "rejected"}`, configuredSiteOrigin(request)), 303);
  }
  try {
    const settings = await getBookingSettings();
    const updated = previous ? await updateReservationFromAdmin(id, validateAdminReservation(Object.fromEntries(form), settings), session.userId) : null;
    if (updated && previous?.status !== "cancelled" && updated.status === "cancelled") {
      const delivered = await notifyReservationCancellation(updated);
      return NextResponse.redirect(new URL(`/admin/reservations?update=${delivered ? "cancelled" : "email-failed"}`, configuredSiteOrigin(request)), 303);
    }
    return NextResponse.redirect(new URL(`/admin/reservations?update=${updated ? "success" : "rejected"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof BookingValidationError ? "invalid" : error instanceof Error && error.message.includes("CAPACITY_EXCEEDED") ? "capacity" : "rejected";
    return NextResponse.redirect(new URL(`/admin/reservations?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
