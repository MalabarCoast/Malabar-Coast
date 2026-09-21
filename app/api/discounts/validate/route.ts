import {findActiveDiscountCode, normalizeDiscountCode} from "../../../lib/discount-store";
import {checkRateLimit, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson, RequestBodyTooLargeError} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return noStoreJson({error: "Invalid request origin."}, {status: 403});
  const rate = checkRateLimit("discount-validation", getClientAddress(request), 20, 10 * 60_000);
  if (!rate.allowed) {
    const response = noStoreJson({error: "Too many code attempts. Please wait before trying again."}, {status: 429});
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }

  try {
    const body = await readLimitedJson(request, 2_000) as {code?: unknown};
    const code = normalizeDiscountCode(body.code);
    if (!/^[A-Z0-9]{3,32}$/.test(code)) {
      return noStoreJson({error: "Enter a valid discount code."}, {status: 400});
    }
    const discount = await findActiveDiscountCode(code);
    if (!discount) return noStoreJson({error: "That discount code is not recognized or is no longer active."}, {status: 404});
    return noStoreJson({code: discount.code, percentOff: discount.percentOff});
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : error instanceof SyntaxError ? 400 : 500;
    if (status === 500) console.error("Discount code validation failed.", error instanceof Error ? error.name : "UnknownError");
    return noStoreJson({error: status === 413 ? "Request is too large." : status === 400 ? "Enter a valid discount code." : "The code could not be checked. Please try again."}, {status});
  }
}
