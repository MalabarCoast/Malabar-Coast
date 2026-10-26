import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {acknowledgeAdminAlert, pendingAdminAlerts} from "../../../lib/admin-alerts";
import {pushConfiguration,pushConfigurationProblem} from "../../../lib/admin-push";
import {checkRateLimit, getClientAddress, isTrustedOrigin, noStoreJson, readLimitedJson} from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession("dashboard:read");
  if (!session) return noStoreJson({error: "Your staff session expired. Sign in again."}, {status: 401});
  const rate = checkRateLimit("admin-alert-feed", `${session.userId}:${getClientAddress(request)}`, 120, 60_000);
  if (!rate.allowed) return noStoreJson({error: "Too many alert checks."}, {status: 429});
  try {
    const alerts = await pendingAdminAlerts(session);
    return noStoreJson({alerts, publicKey: pushConfiguration()?.publicKey || null, pushError: pushConfigurationProblem(), expiresAt: session.expiresAt});
  } catch {
    return noStoreJson({error: "Staff alerts are unavailable. Check the alert database migration and connection."}, {status: 503});
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession("dashboard:read");
  if (!session || !isTrustedOrigin(request)) return noStoreJson({error: "Forbidden"}, {status: 403});
  if (!checkRateLimit("admin-alert-ack", session.userId, 120, 60_000).allowed) return noStoreJson({error: "Try again shortly."}, {status: 429});
  try {
    const body = await readLimitedJson(request, 2000) as {csrf?: string; id?: string};
    if (!verifyAdminCsrf(session, String(body.csrf || ""))) return noStoreJson({error: "Forbidden"}, {status: 403});
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.id || "")) return noStoreJson({error: "Invalid alert"}, {status: 400});
    const acknowledged = await acknowledgeAdminAlert(session, body.id!);
    return noStoreJson({acknowledged}, {status: acknowledged ? 200 : 409});
  } catch { return noStoreJson({error: "Acknowledgement could not be saved."}, {status: 503}); }
}
