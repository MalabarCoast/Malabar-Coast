import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../../lib/admin-auth";
import {deleteDiscountCode, DiscountValidationError, saveDiscountCode, validateDiscountCodeInput} from "../../../../lib/discount-store";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getAdminSession("discounts:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  try {
    const form = await readLimitedFormData(request, 8_000);
    if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
    const {id} = await params;
    if (form.get("action") === "delete") {
      const deleted = await deleteDiscountCode(id, session.userId);
      return NextResponse.redirect(new URL(`/admin/discounts?update=${deleted ? "deleted" : "rejected"}`, configuredSiteOrigin(request)), 303);
    }
    const input = validateDiscountCodeInput({
      code: form.get("code"),
      percentOff: form.get("percentOff"),
      active: form.get("active"),
    });
    const saved = await saveDiscountCode({id, ...input}, session.userId);
    return NextResponse.redirect(new URL(`/admin/discounts?update=${saved ? "saved" : "duplicate"}`, configuredSiteOrigin(request)), 303);
  } catch (error) {
    const update = error instanceof DiscountValidationError ? "invalid" : "rejected";
    return NextResponse.redirect(new URL(`/admin/discounts?update=${update}`, configuredSiteOrigin(request)), 303);
  }
}
