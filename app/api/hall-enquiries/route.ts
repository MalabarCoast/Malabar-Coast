import { createHallEnquiry } from "../../lib/booking-store";
import { BookingValidationError, validateHallEnquiry } from "../../lib/bookings";
import { notifyHallEnquiry } from "../../lib/email/notifications";
import {publishAdminActivityEvent} from "../../lib/publishEvent";
import {assertServiceAvailable, ServiceUnavailableError} from "../../lib/service-availability-store";
import { checkRateLimit, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson, RequestBodyTooLargeError } from "../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) return noStoreJson({ error: "Invalid request origin." }, { status: 403 });
    const rate = checkRateLimit("hall-enquiry", getClientAddress(request), 4, 60 * 60_000);
    if (!rate.allowed) return noStoreJson({ error: "Too many enquiries. Please wait before trying again." }, { status: 429 });
    await assertServiceAvailable("hall");
    const enquiry = await createHallEnquiry(validateHallEnquiry(await readLimitedJson(request, 32_000)));
    await Promise.all([notifyHallEnquiry(enquiry), publishAdminActivityEvent("hall", enquiry.id)]);
    return noStoreJson({ reference: enquiry.reference }, { status: 201 });
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : error instanceof ServiceUnavailableError ? 409 : error instanceof BookingValidationError || error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error("Hall enquiry failed.", error instanceof Error ? error.name : "UnknownError");
    return noStoreJson({ error: error instanceof ServiceUnavailableError || error instanceof BookingValidationError ? error.message : status === 413 ? "Enquiry is too large." : "The enquiry could not be sent. Please try again." }, { status });
  }
}
