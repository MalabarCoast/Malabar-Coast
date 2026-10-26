import { getSupabaseChannelClient } from "./config/supabase_channel";
import {dispatchAdminPush} from "./admin-push";
import {after} from "next/server";

export type AdminActivityKind = "order" | "reservation" | "hall";

export async function publishAdminActivityEvent(kind: AdminActivityKind, recordId: string) {
  // The database trigger has already queued the alert atomically. Push transport
  // must never change the success of the underlying payment or booking.
  try { after(async () => {await dispatchAdminPush().catch(() => console.warn("Staff push is queued for retry."));}); }
  catch { /* Non-request maintenance scripts rely on the durable dispatcher. */ }
  let supabase: ReturnType<typeof getSupabaseChannelClient>;
  try {
    supabase = getSupabaseChannelClient();
  } catch (error) {
    console.warn("The record was saved, but the admin notification client is unavailable.", error instanceof Error ? error.name : "UnknownError");
    return false;
  }

  const channel = supabase.channel("admin-activity");
  try {
    const result = await channel.httpSend("activity-changed", {
      kind,
      recordId,
      changedAt: new Date().toISOString(),
    });

    if (!result.success) {
      console.warn("The record was saved, but the admin notification could not be published.");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("The record was saved, but the admin notification failed.", error instanceof Error ? error.name : "UnknownError");
    return false;
  } finally {
    void supabase.removeChannel(channel);
  }
}

export function publishPaymentCompletionEvent(orderId: string) {
  return publishAdminActivityEvent("order", orderId);
}
