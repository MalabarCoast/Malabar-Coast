const CACHE = "malabar-public-offline-v2";
self.addEventListener("install", (event) => {event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/offline.html", "/malabar af.svg"]))); self.skipWaiting();});
self.addEventListener("activate", (event) => {event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("malabar-public-offline-") && key !== CACHE).map((key) => caches.delete(key)))), self.clients.claim()]));});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !request.mode || request.mode !== "navigate") return;
  if (/^\/(?:admin|api|checkout|order)(?:\/|$)/.test(url.pathname)) return;
  event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
});
