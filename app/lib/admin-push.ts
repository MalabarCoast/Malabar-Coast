import webpush from "web-push";
import {createECDH} from "node:crypto";
import {supabaseServerRpc} from "./supabase/server";
import {validatePushSubscription} from "./push-validation";

export function pushConfiguration() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim();
  const valid = publicKey && /^[A-Za-z0-9_-]{87}$/.test(publicKey)
    && privateKey && /^[A-Za-z0-9_-]{43}$/.test(privateKey)
    && subject && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject)
    ? {publicKey, privateKey, subject} : null;
  if (!valid) return null;
  try {
    const curve = createECDH("prime256v1");
    curve.setPrivateKey(Buffer.from(valid.privateKey, "base64url"));
    return curve.getPublicKey().toString("base64url") === valid.publicKey ? valid : null;
  } catch { return null; }
}

type Delivery = {alertId: string; subscriptionId: string; leaseToken: string; subscription: unknown};

export async function sendStaffPush(subscription: unknown, tag: string) {
  const config = pushConfiguration();
  if (!config) throw new Error("Background push is not configured.");
  return webpush.sendNotification(validatePushSubscription(subscription), JSON.stringify({
    title: "Malabar Coast · Staff alert",
    body: "New restaurant activity needs attention. Open operations to review.", tag,
  }), {vapidDetails: config, TTL: 3600, urgency: "high", timeout: 5000});
}

export async function dispatchAdminPush() {
  const config = pushConfiguration();
  if (!config) return {configured: false, sent: 0, failed: 0};
  const deliveries = await supabaseServerRpc<Delivery[]>("claim_admin_push_deliveries", {});
  let sent = 0;
  let failed = 0;
  // Bounded batches and leases allow webhook dispatch and scheduler dispatch to overlap.
  for (let offset = 0; offset < deliveries.length; offset += 5) {
    await Promise.all(deliveries.slice(offset, offset + 5).map(async (delivery) => {
      let success = false;
      let expired = false;
      try {
        await sendStaffPush(delivery.subscription, `mc-alert-${delivery.alertId}`);
        success = true;
        sent += 1;
      } catch (error) {
        const status = (error as {statusCode?: number}).statusCode;
        expired = status === 404 || status === 410;
        failed += 1;
        // Never log endpoint URLs, subscription encryption keys or provider response bodies.
        console.warn("Staff push delivery failed.", status || "transport");
      }
      await supabaseServerRpc("complete_admin_push_delivery", {
        p_alert_id: delivery.alertId, p_subscription_id: delivery.subscriptionId,
        p_lease_token: delivery.leaseToken, p_success: success, p_expired: expired,
      });
    }));
  }
  return {configured: true, sent, failed};
}
