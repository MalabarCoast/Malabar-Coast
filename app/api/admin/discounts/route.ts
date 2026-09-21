import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {saveDiscountCode, validateDiscountCodeInput, DiscountValidationError} from "../../../lib/discount-store";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("discounts:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  try {
    const form = await readLimitedFormData(request, 8_000);
    if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
    const input = validateDiscountCodeInput({
      code: form.get("code"),
      percentOff: form.get("percentOff"),
      active: form.get("active"),
    });
    const saved = await saveDiscountCode(input, session.userId);
    return NextResponse.redirect(new URL(`/admin/discounts?update=${saved ? "created" : "duplicate"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof DiscountValidationError ? "invalid" : "rejected";
    return NextResponse.redirect(new URL(`/admin/discounts?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
