import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {applyScheduleChange, parseScheduleChange, scheduleImpact, schedulePreviewToken} from "../../../lib/schedule-admin";
import {getRestaurantSchedule, updateRestaurantSchedule} from "../../../lib/schedule-store";
import {isTrustedOrigin, noStoreJson, readLimitedJson} from "../../../lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("reservations:write");
  if (!session || !isTrustedOrigin(request)) return noStoreJson({error: "Forbidden"}, {status: 403});
  try {
    const body = await readLimitedJson(request, 16_000) as Record<string, unknown>;
    if (!verifyAdminCsrf(session, String(body.csrf || ""))) return noStoreJson({error: "Forbidden"}, {status: 403});
    const change = parseScheduleChange(body.change);
    const current = await getRestaurantSchedule();
    const next = applyScheduleChange(current, change);
    const impact = await scheduleImpact(next, change);
    const token = schedulePreviewToken(current, change, impact);
    if (body.action === "preview") return noStoreJson({impact, token});
    if (body.action !== "save" || body.token !== token) return noStoreJson({error: "The calendar or affected bookings changed. Review the latest preview before saving."}, {status: 409});
    const saved = await updateRestaurantSchedule(next, session.userId);
    if (!saved) return noStoreJson({error: "The calendar changed. Refresh and preview again."}, {status: 409});
    return noStoreJson({saved: true, schedule: await getRestaurantSchedule()});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendar update failed.";
    return noStoreJson({error: message}, {status: 400});
  }
}
