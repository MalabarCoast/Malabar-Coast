import {NextResponse} from "next/server";
import {getAdminSession, verifyAdminCsrf} from "../../../../lib/admin-auth";
import {deleteCareerFromAdmin} from "../../../../lib/career-store";
import {configuredSiteOrigin, isTrustedOrigin, readLimitedFormData} from "../../../../lib/security";

export const runtime = "nodejs";

const careerIdPattern = /^job_[A-Za-z0-9_-]{16,80}$/;

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const session = await getAdminSession("content:write");
  if (!session || !isTrustedOrigin(request)) return new NextResponse("Forbidden", {status: 403});
  const form = await readLimitedFormData(request, 8_000);
  if (!verifyAdminCsrf(session, String(form.get("csrf") || "")) || form.get("action") !== "delete") return new NextResponse("Forbidden", {status: 403});
  const {id} = await params;
  if (!careerIdPattern.test(id)) return new NextResponse("Invalid job reference", {status: 400});

  let update = "rejected";
  try {
    update = await deleteCareerFromAdmin(id, session.userId) ? "deleted" : "rejected";
  } catch (error) {
    if (error instanceof Error && error.message.includes("database update")) update = "setup";
  }
  return NextResponse.redirect(new URL(`/admin/careers?update=${update}`, configuredSiteOrigin(request)), 303);
}
