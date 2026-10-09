import {randomBytes} from "node:crypto";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {applyImmediateServiceChange, deleteServiceClosure, parseServiceClosure, saveServiceClosure} from "../../../lib/service-availability-admin";
import {getServiceAvailability, updateServiceAvailability} from "../../../lib/service-availability-store";
import {noStoreJson, isTrustedOrigin, readLimitedJson} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("availability:write");
  if (!session || !isTrustedOrigin(request)) return noStoreJson({error: "Forbidden"}, {status: 403});
  try {
    const body = await readLimitedJson(request, 16_000) as Record<string, unknown>;
    if (!verifyAdminCsrf(session, String(body.csrf || ""))) return noStoreJson({error: "Forbidden"}, {status: 403});
    const current = await getServiceAvailability();
    if (Number(body.revision) !== current.revision) return noStoreJson({error: "These controls changed in another session. Refresh and try again."}, {status: 409});
    let next;
    if (body.action === "set_channels") next = applyImmediateServiceChange(current, body.change);
    else if (body.action === "save_closure") {
      const requestedId = String((body.change as Record<string, unknown> | undefined)?.id || "");
      const id = requestedId || `svc_${randomBytes(18).toString("base64url")}`;
      if (requestedId && !current.closures.some((item) => item.id === requestedId)) return noStoreJson({error: "That scheduled closure no longer exists."}, {status: 409});
      next = saveServiceClosure(current, parseServiceClosure(body.change, id));
    } else if (body.action === "delete_closure") next = deleteServiceClosure(current, String(body.closureId || ""));
    else return noStoreJson({error: "Choose a valid control action."}, {status: 400});
    const saved = await updateServiceAvailability(next, session.userId);
    if (!saved) return noStoreJson({error: "These controls changed in another session. Refresh and try again."}, {status: 409});
    return noStoreJson({availability: await getServiceAvailability()});
  } catch (error) {
    return noStoreJson({error: error instanceof Error ? error.message : "Service controls could not be saved."}, {status: 400});
  }
}
