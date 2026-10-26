import {timingSafeEqual} from "node:crypto";
import {dispatchAdminPush} from "../../../lib/admin-push";
import {noStoreJson} from "../../../lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!secret || secret.length < 32 || Buffer.byteLength(token) !== Buffer.byteLength(secret)
    || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) return noStoreJson({error: "Unauthorized"}, {status: 401});
  try { return noStoreJson(await dispatchAdminPush()); }
  catch { return noStoreJson({error: "Push dispatch failed; queued alerts are retained."}, {status: 503}); }
}
