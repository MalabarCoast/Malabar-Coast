import { createReservation, getBookingSettings } from "../../lib/booking-store";
import { BookingValidationError, validateReservation } from "../../lib/bookings";
import { notifyReservation } from "../../lib/email/notifications";
import { getRestaurantSchedule } from "../../lib/schedule-store";
import {publishAdminActivityEvent} from "../../lib/publishEvent";
import {assertServiceAvailable, ServiceUnavailableError} from "../../lib/service-availability-store";
import { checkRateLimit, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson, RequestBodyTooLargeError } from "../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) return noStoreJson({ error: "Invalid request origin." }, { status: 403 });
    const rate = checkRateLimit("table-reservation", getClientAddress(request), 6, 60 * 60_000);
    if (!rate.allowed) return noStoreJson({ error: "Too many booking attempts. Please wait before trying again." }, { status: 429 });
    await assertServiceAvailable("table");
    const [settings, schedule] = await Promise.all([getBookingSettings(), getRestaurantSchedule()]);
    const input = validateReservation(await readLimitedJson(request, 32_000), settings, schedule);
    const reservation = await createReservation(input);
    await Promise.all([notifyReservation(reservation), publishAdminActivityEvent("reservation", reservation.id)]);
    return noStoreJson({ reference: reservation.reference, bookingDate: reservation.bookingDate, startTime: reservation.startTime, endTime: reservation.endTime, partySize: reservation.partySize }, { status: 201 });
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : error instanceof ServiceUnavailableError ? 409 : error instanceof BookingValidationError || error instanceof SyntaxError ? 400 : error instanceof Error && error.message === "CAPACITY_EXCEEDED" ? 409 : 500;
    const message = error instanceof ServiceUnavailableError || error instanceof BookingValidationError ? error.message : status === 413 ? "Booking request is too large." : status === 409 ? "That sitting has just reached capacity. Please choose another time." : "The booking could not be completed. Please try again.";
    if (status >= 500) console.error("Table reservation failed.", error instanceof Error ? error.name : "UnknownError");
    return noStoreJson({ error: message }, { status });
  }
}
