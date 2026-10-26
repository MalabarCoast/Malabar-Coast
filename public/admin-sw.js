const VERSION = "mc-admin-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let tag = "mc-staff-alert";
    try {
      const data = event.data && event.data.json();
      if (/^mc-alert-[a-f0-9-]{36}$/.test(data?.tag || "")) tag = data.tag;
    } catch { /* Use a safe generic notification. */ }
    await self.registration.showNotification("Malabar Coast · Staff alert", {
      body: "Restaurant activity needs attention. Open operations to review.",
      icon: "/icon-192.png", badge: "/icon-192.png", tag,
      requireInteraction: true, silent: false, vibrate: [400, 150, 400, 150, 600],
      data: {url: "/admin/orders"},
    });
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    for (const client of windows) if (/^\/admin(?:\/|$)/.test(new URL(client.url).pathname)) client.postMessage({type: "mc-alert-refresh"});
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL("/admin/orders", self.location.origin).href;
    const windows = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin && /^\/admin(?:\/|$)/.test(new URL(client.url).pathname));
    if (existing) { await existing.focus(); await existing.navigate(url); }
    else await self.clients.openWindow(url);
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !/^\/admin(?:\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(request).catch(() => {
    if (request.mode !== "navigate") return Response.error();
    return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#071310"><title>MC Operations offline</title><body style="margin:0;background:#071310;color:#f5efe2;font:18px/1.5 Georgia,serif;display:grid;min-height:100svh;place-items:center"><main style="max-width:34rem;padding:max(2rem,env(safe-area-inset-top)) max(1.25rem,env(safe-area-inset-right)) max(2rem,env(safe-area-inset-bottom)) max(1.25rem,env(safe-area-inset-left))"><p style="letter-spacing:.14em;text-transform:uppercase;font:12px Arial,sans-serif;color:#c8a45d">Malabar Coast operations</p><h1 style="font-size:clamp(36px,12vw,48px);line-height:1;margin:.5rem 0 1rem">You are offline.</h1><p>Reconnect to securely load live orders, bookings and restaurant data.</p><a href="/admin/orders" style="min-height:44px;margin-top:1rem;padding:.8rem 1rem;border:0;background:#c8a45d;color:#071310;font-weight:700">Try again</a></main></body></html>`, {headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Admin-Shell": VERSION, "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}});
  }));
});
