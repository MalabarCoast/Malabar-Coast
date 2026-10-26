import {createHash} from "node:crypto";
import {getAdminSession, verifyAdminCsrf} from "../../../lib/admin-auth";
import {pushSessionHash, removeSessionPushSubscriptions} from "../../../lib/admin-alerts";
import {pushConfigurationProblem,sendStaffPush} from "../../../lib/admin-push";
import {validatePushSubscription} from "../../../lib/push-validation";
import {checkRateLimit, isTrustedOrigin, noStoreJson, readLimitedJson} from "../../../lib/security";
import {supabaseServerRpc} from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getAdminSession("dashboard:read");
  if (!session || !isTrustedOrigin(request)) return noStoreJson({error: "Forbidden"}, {status: 403});
  if (!checkRateLimit("push-settings", session.userId, 30, 60_000).allowed) return noStoreJson({error: "Try again shortly."}, {status: 429});
  try {
    const body = await readLimitedJson(request, 6000) as {csrf?: string; action?: string; subscription?: unknown};
    if (!verifyAdminCsrf(session, String(body.csrf || ""))) return noStoreJson({error: "Forbidden"}, {status: 403});
    if (body.action === "disable") {
      await removeSessionPushSubscriptions(session);
      return noStoreJson({enabled: false});
    }
    if (body.action !== "enable" && body.action !== "test") return noStoreJson({error: "Invalid action"}, {status: 400});
    const configurationProblem = pushConfigurationProblem();
    if (configurationProblem) return noStoreJson({error: configurationProblem}, {status: 503});
    let subscription;
    try { subscription = validatePushSubscription(body.subscription); }
    catch { return noStoreJson({error: "Invalid browser push subscription."}, {status: 400}); }
    const id = createHash("sha256").update(subscription.endpoint).digest("hex");
    if (body.action === "test") {
      if (!checkRateLimit("push-test", session.userId, 3, 60_000).allowed) return noStoreJson({error: "Wait a minute before sending another test."}, {status: 429});
      const ownSubscription = await supabaseServerRpc<unknown>("get_admin_push_subscription", {p_id: id, p_actor_user_id: session.userId, p_session_hash: pushSessionHash(session)});
      if (!ownSubscription) return noStoreJson({error: "Enable background alerts on this device first."}, {status: 409});
      await sendStaffPush(ownSubscription, "mc-staff-test");
      return noStoreJson({tested: true});
    }
    const saved = await supabaseServerRpc<boolean>("save_admin_push_subscription", {
      p_id: id,
      p_actor_user_id: session.userId, p_session_version: session.sessionVersion,
      p_session_hash: pushSessionHash(session), p_subscription: subscription,
      // Device notification permission outlives the UI login, but never grants
      // access to private records. Active staff/version checks still apply.
      p_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    });
    return noStoreJson({enabled: saved}, {status: saved ? 200 : 409});
  } catch { return noStoreJson({error: "Background alert settings could not be saved."}, {status: 503}); }
}
