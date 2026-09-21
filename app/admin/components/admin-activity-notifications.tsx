"use client";

import {createClient} from "@supabase/supabase-js";
import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {armOrderNotificationSound, playOrderNotificationSound} from "./order-notification-sound";

type ActivityKind = "order" | "reservation" | "hall";
type BroadcastPayload = {kind?: unknown; recordId?: unknown; changedAt?: unknown};
type Notice = {key: string; title: string; detail: string; href: string};

const idPatterns: Record<ActivityKind, RegExp> = {
  order: /^ord_[A-Za-z0-9_-]{20,60}$/,
  reservation: /^res_[A-Za-z0-9_-]{16,80}$/,
  hall: /^hall_[A-Za-z0-9_-]{16,80}$/,
};

const endpoints: Record<ActivityKind, (id: string) => string> = {
  order: (id) => `/api/admin/orders/${encodeURIComponent(id)}`,
  reservation: (id) => `/api/admin/reservations/${encodeURIComponent(id)}`,
  hall: (id) => `/api/admin/hall-enquiries/${encodeURIComponent(id)}`,
};

function activityKind(value: unknown): value is ActivityKind {
  return value === "order" || value === "reservation" || value === "hall";
}

export function AdminActivityNotifications({supabaseUrl, publishableKey}: {supabaseUrl: string; publishableKey: string}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!supabaseUrl || !publishableKey) return;
    const seenKeys = seen.current;
    let soundArmed = false;
    const arm = () => {
      if (soundArmed) return;
      void armOrderNotificationSound().then((ready) => {
        soundArmed = ready;
        if (ready) {
          window.removeEventListener("pointerdown", arm);
          window.removeEventListener("keydown", arm);
        }
      });
    };
    arm();
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    window.addEventListener("focus", arm);
    document.addEventListener("visibilitychange", arm);

    const supabase = createClient(supabaseUrl, publishableKey, {auth: {autoRefreshToken: false, persistSession: false}});
    const verify = async (payload: BroadcastPayload) => {
      if (!activityKind(payload.kind) || typeof payload.recordId !== "string" || !idPatterns[payload.kind].test(payload.recordId)) return;
      const key = `${payload.kind}:${payload.recordId}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      try {
        const response = await fetch(endpoints[payload.kind](payload.recordId), {credentials: "same-origin", cache: "no-store"});
        if (!response.ok) return;
        const body = await response.json() as Record<string, Record<string, unknown> | undefined>;
        const record = payload.kind === "order" ? body.order : payload.kind === "reservation" ? body.reservation : body.hallEnquiry;
        if (!record || record.id !== payload.recordId) return;

        const notice: Notice = payload.kind === "order"
          ? {key, title: "New paid food order", detail: `${String(record.customer && typeof record.customer === "object" && "name" in record.customer ? record.customer.name : "Customer")} · ${String(record.fulfilment || "Order")}`, href: `/admin/orders/${payload.recordId}`}
          : payload.kind === "reservation"
            ? {key, title: "New table booking", detail: `${String(record.name)} · ${String(record.bookingDate)} at ${String(record.startTime)} · ${String(record.partySize)} guests`, href: "/admin/reservations"}
            : {key, title: "New hall enquiry", detail: `${String(record.name)} · ${String(record.preferredDate)} · ${record.guestCount ? `${String(record.guestCount)} guests` : "Guest count pending"}`, href: "/admin/hall-enquiries"};

        playOrderNotificationSound();
        setNotices((current) => [notice, ...current.filter((item) => item.key !== key)].slice(0, 4));
        if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
          new Notification(notice.title, {body: notice.detail, icon: "/icon.svg", tag: key});
        }
      } catch (error) {
        console.error("Could not verify the new restaurant activity.", error);
      }
    };

    const channel = supabase.channel("admin-activity").on("broadcast", {event: "activity-changed"}, ({payload}) => { void verify(payload as BroadcastPayload); }).subscribe();
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("focus", arm);
      document.removeEventListener("visibilitychange", arm);
      seenKeys.clear();
      void supabase.removeChannel(channel);
    };
  }, [publishableKey, supabaseUrl]);

  return <aside className="adminNotificationRail" aria-label="Live restaurant alerts">
    <div className="adminNotifications" aria-live="polite" aria-atomic="false">
      {notices.map((notice) => <article className="adminNotification" key={notice.key}>
        <span>Live alert</span><strong>{notice.title}</strong><p>{notice.detail}</p>
        <div><Link href={notice.href}>Open</Link><button type="button" onClick={() => setNotices((current) => current.filter((item) => item.key !== notice.key))}>Dismiss</button></div>
      </article>)}
    </div>
  </aside>;
}
