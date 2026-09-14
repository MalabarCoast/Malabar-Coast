import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {saveCareer} from "../../../lib/career-store";
import {validateCareer} from "../../../lib/careers";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../lib/security";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await getAdminSession("content:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  let result = "saved";
  try {
    const form = await readLimitedFormData(request, 32_000);
    if (!verifyAdminCsrf(session, String(form.get("csrf") || ""))) return new NextResponse("Forbidden", {status: 403});
    const id = String(form.get("id") || "");
    if (id && !/^job_[A-Za-z0-9_-]{16,80}$/.test(id)) throw new Error("Invalid job reference.");
    if (!await saveCareer(validateCareer(Object.fromEntries(form)), session.userId, id || undefined)) result = "rejected";
  } catch (error) {result = error instanceof Error && error.message.includes("database update") ? "setup" : "rejected";}
  return NextResponse.redirect(new URL(`/admin/careers?update=${result}`, configuredSiteOrigin(request)), 303);
}
