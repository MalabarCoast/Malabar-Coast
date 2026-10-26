// These are browser-vendor push services, never caller-selected HTTP destinations.
// Exact DNS suffix boundaries prevent private-address and lookalike-host SSRF.
export function isAllowedPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash) return false;
    return url.hostname === "fcm.googleapis.com"
      || url.hostname === "updates.push.services.mozilla.com"
      || url.hostname.endsWith(".push.apple.com")
      || url.hostname.endsWith(".notify.windows.com");
  } catch { return false; }
}

export function validatePushSubscription(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid push subscription.");
  const candidate = value as {endpoint?: unknown; keys?: {p256dh?: unknown; auth?: unknown}};
  if (!isAllowedPushEndpoint(candidate.endpoint)) throw new Error("Unsupported push service.");
  const {p256dh, auth} = candidate.keys || {};
  if (typeof p256dh !== "string" || !/^[A-Za-z0-9_-]{87}=?$/.test(p256dh)
    || typeof auth !== "string" || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(auth)) throw new Error("Invalid push encryption keys.");
  const publicKey = Buffer.from(p256dh, "base64url");
  if (publicKey.length !== 65 || publicKey[0] !== 4 || Buffer.from(auth, "base64url").length !== 16) throw new Error("Invalid push encryption keys.");
  // Canonicalize before passing to a transport using its own URL parser.
  return {endpoint: new URL(candidate.endpoint).href, keys: {p256dh, auth}};
}
