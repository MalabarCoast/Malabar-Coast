"use client";

import {useEffect} from "react";

export async function getAdminWorker() {
  const registration = await navigator.serviceWorker.register("/admin-sw.js", {scope: "/admin", updateViaCache: "none"});
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const old of registrations) {
    if (old.scope === `${location.origin}/admin/` && old.active?.scriptURL === `${location.origin}/admin-sw.js`) await old.unregister();
  }
  if (!registration.active) {
    await new Promise<void>((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) { reject(new Error("Operations worker is not ready.")); return; }
      const changed = () => {
        if (worker.state === "activated" || worker.state === "redundant") {
          window.clearTimeout(timeout);
          worker.removeEventListener("statechange", changed);
          if (worker.state === "activated") resolve(); else reject(new Error("Operations worker could not activate."));
        }
      };
      const timeout = window.setTimeout(() => {worker.removeEventListener("statechange", changed); reject(new Error("Operations worker activation timed out."));}, 12_000);
      worker.addEventListener("statechange", changed);
      changed();
    });
  }
  return registration;
}

export function AdminPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void getAdminWorker().catch(() => window.dispatchEvent(new Event("malabar:pwa-error")));
  }, []);
  return null;
}
