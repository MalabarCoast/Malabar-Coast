import {createHash} from "node:crypto";
import type {AdminSession} from "./admin-auth";
import {supabaseServerRpc} from "./supabase/server";

export type AdminAlert = {
  id: string;
  kind: "order" | "reservation" | "hall";
  recordId: string;
  title: string;
  href: string;
  createdAt: string;
  canAcknowledge: boolean;
};

export function pushSessionHash(session: Pick<AdminSession, "nonce">) {
  return createHash("sha256").update(session.nonce).digest("hex");
}

export function pendingAdminAlerts(session: AdminSession) {
  return supabaseServerRpc<AdminAlert[]>("pending_admin_alerts", {p_actor_user_id: session.userId});
}

export function acknowledgeAdminAlert(session: AdminSession, id: string) {
  return supabaseServerRpc<boolean>("acknowledge_admin_alert", {p_actor_user_id: session.userId, p_alert_id: id});
}

export function removeSessionPushSubscriptions(session: AdminSession) {
  return supabaseServerRpc("remove_admin_push_subscriptions", {p_actor_user_id: session.userId, p_session_hash: pushSessionHash(session)});
}

export async function checkAdminAlertsSchema() {
  try { return await supabaseServerRpc<boolean>("admin_alerts_health", {}); }
  catch { return false; }
}
