"use client";

import {createClient} from "@supabase/supabase-js";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useRef, useState} from "react";
import type {AdminAlert} from "../../lib/admin-alerts";
import {armOrderNotificationSound, notificationAudioRunning, playOrderNotificationSound, stopOrderNotificationSound} from "./order-notification-sound";
import {getAdminWorker} from "./admin-pwa-registration";

type InstallPrompt = Event & {prompt(): Promise<void>; userChoice: Promise<{outcome: string}>};
type WakeLock = {release(): Promise<void>; released: boolean};
type AlertFeed = {alerts?: AdminAlert[]; publicKey?: string | null; pushError?: string | null; expiresAt?: number; error?: string};
const lastRingKey = "mc-staff-last-ring-v2";

function applicationServerKey(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function AdminActivityNotifications({supabaseUrl, publishableKey, csrfToken, expiresAt}: {
  supabaseUrl: string; publishableKey: string; csrfToken: string; expiresAt: number;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [feedState, setFeedState] = useState("Checking alerts…");
  const [audioReady, setAudioReady] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushStatus, setPushStatus] = useState("Background alerts not enabled");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [keepAwake, setKeepAwake] = useState(false);
  const [awakeState, setAwakeState] = useState("");
  const [sessionRemaining, setSessionRemaining] = useState(() => Math.max(0, expiresAt * 1000 - Date.now()));
  const pending = useRef<AdminAlert[]>([]);
  const enabled = useRef(true);
  const fetching = useRef(false);
  const lastFetch = useRef(0);
  const renewedPush = useRef(false);
  const alertSignature = useRef("");
  const mounted = useRef(false);

  const savePush = useCallback(async (subscription: PushSubscription, action = "enable") => {
    const response = await fetch("/api/admin/push", {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({csrf: csrfToken, action, subscription: subscription.toJSON()}),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await response.json() as {enabled?: boolean; error?: string; tested?: boolean};
    if (!response.ok) throw new Error(body.error || "Background alert settings could not be saved.");
    return body;
  }, [csrfToken]);

  const refresh = useCallback(async () => {
    if (fetching.current || Date.now() - lastFetch.current < 1500) return;
    fetching.current = true;
    lastFetch.current = Date.now();
    try {
      const response = await fetch("/api/admin/alerts", {credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(8000)});
      const body = await response.json() as AlertFeed;
      if (!mounted.current) return;
      if (response.status === 401) {
        pending.current = [];
        setAlerts([]);
        stopOrderNotificationSound();
        setFeedState("Session expired — sign in again");
        setSessionRemaining(0);
        setPushStatus("Sign in to manage device background alerts");
        return;
      }
      if (!response.ok || !Array.isArray(body.alerts)) throw new Error(body.error || "Alerts unavailable");
      // Only the authenticated, role-filtered database feed establishes alerts.
      pending.current = body.alerts;
      const signature = body.alerts.map((alert) => alert.id).join(",");
      if (signature !== alertSignature.current) {alertSignature.current = signature; router.refresh();}
      setAlerts(body.alerts);
      setPublicKey(body.publicKey || null);
      setPushError(body.pushError || null);
      if (!body.publicKey) setPushStatus("Background alerts need deployment environment settings");
      setFeedState("Alerts connected");
      if (body.alerts.length === 0) stopOrderNotificationSound();
      if (body.publicKey && !renewedPush.current && "Notification" in window && Notification.permission === "granted" && "serviceWorker" in navigator) {
        renewedPush.current = true;
        void getAdminWorker().then((worker) => worker.pushManager.getSubscription()).then(async (subscription) => {
          if (subscription) {
            const existing = subscription.options.applicationServerKey ? new Uint8Array(subscription.options.applicationServerKey) : null;
            const expected = applicationServerKey(body.publicKey!);
            if (!existing || existing.length !== expected.length || existing.some((byte, index) => byte !== expected[index])) throw new Error("Device subscription needs renewal.");
            await savePush(subscription);
            if (mounted.current) setPushStatus("Background alerts enabled on this device for 30 days");
          }
        }).catch(() => {renewedPush.current = false; if (mounted.current) setPushStatus("Background alerts need reconnecting");});
      }
    } catch {
      if (mounted.current) setFeedState(navigator.onLine ? "Alert checks failed — reconnecting" : "Offline — alerts cannot arrive");
    } finally { fetching.current = false; }
  }, [router, savePush]);

  useEffect(() => {
    mounted.current = true;
    const arm = () => {
      if (!enabled.current || notificationAudioRunning()) return;
      void armOrderNotificationSound().then((ready) => {if (mounted.current) setAudioReady(ready);});
    };
    const audioState = () => setAudioReady(notificationAudioRunning());
    const onFocus = () => {arm(); void refresh();};
    const onVisibility = () => {if (document.visibilityState === "visible") onFocus();};
    const onWorkerMessage = (event: MessageEvent) => {if (event.data?.type === "mc-alert-refresh") void refresh();};
    const onOffline = () => setFeedState("Offline — alerts cannot arrive");
    const pwaError = () => setPushStatus("Operations app setup failed — reload to retry");
    const install = (event: Event) => {event.preventDefault(); setInstallPrompt(event as InstallPrompt);};
    const appInstalled = () => {setInstalled(true); setInstallPrompt(null);};
    const frame = window.requestAnimationFrame(() => {
      setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone));
      setAudioReady(notificationAudioRunning());
      void refresh();
    });
    const poll = window.setInterval(() => {
      setSessionRemaining(Math.max(0, expiresAt * 1000 - Date.now()));
      void refresh();
    }, 5000);
    const alarm = window.setInterval(() => {
      if (!pending.current.length || !enabled.current || !notificationAudioRunning() || Date.now() >= expiresAt * 1000) return;
      const ring = () => {
        let last = 0;
        try {last = Number(localStorage.getItem(lastRingKey)) || 0;} catch { /* Storage is optional. */ }
        if (Date.now() - last < 11_000) return;
        if (playOrderNotificationSound()) {
          try {localStorage.setItem(lastRingKey, String(Date.now()));} catch { /* Other tabs may also ring. */ }
        }
      };
      // Coordinate tabs on the same origin so one device does not layer bells.
      if (navigator.locks) void navigator.locks.request("mc-staff-chime", {ifAvailable: true}, (lock) => {if (lock) ring();});
      else ring();
    }, 1000);
    window.addEventListener("pointerdown", arm);
    window.addEventListener("keydown", arm);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("offline", onOffline);
    window.addEventListener("malabar:audio-state", audioState);
    window.addEventListener("malabar:pwa-error", pwaError);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", appInstalled);
    document.addEventListener("visibilitychange", onVisibility);
    navigator.serviceWorker?.addEventListener("message", onWorkerMessage);
    const supabase = supabaseUrl && publishableKey ? createClient(supabaseUrl, publishableKey, {auth: {autoRefreshToken: false, persistSession: false}}) : null;
    const channel = supabase?.channel("admin-activity").on("broadcast", {event: "activity-changed"}, () => {void refresh();}).subscribe();
    return () => {
      mounted.current = false;
      window.cancelAnimationFrame(frame);
      window.clearInterval(poll); window.clearInterval(alarm);
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("malabar:audio-state", audioState);
      window.removeEventListener("malabar:pwa-error", pwaError);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", appInstalled);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
      if (channel && supabase) void supabase.removeChannel(channel);
      stopOrderNotificationSound();
    };
  }, [expiresAt, publishableKey, refresh, supabaseUrl]);

  useEffect(() => {
    if (!keepAwake) return;
    let stopped = false;
    let lock: WakeLock | undefined;
    const request = async () => {
      if (document.visibilityState !== "visible" || lock && !lock.released) return;
      const wakeLock = (navigator as Navigator & {wakeLock?: {request(type: "screen"): Promise<WakeLock>}}).wakeLock;
      if (!wakeLock) {setAwakeState("Keep-awake is unavailable on this device"); return;}
      try {
        const acquired = await wakeLock.request("screen");
        if (stopped) {await acquired.release(); return;}
        lock = acquired;
        setAwakeState("Screen kept awake while operations is visible");
      } catch {setAwakeState("Keep-awake blocked — check power settings");}
    };
    void request();
    document.addEventListener("visibilitychange", request);
    return () => {stopped = true; document.removeEventListener("visibilitychange", request); void lock?.release();};
  }, [keepAwake]);

  async function testSound() {
    enabled.current = true;
    setSoundEnabled(true);
    const ready = await armOrderNotificationSound();
    setAudioReady(ready);
    if (ready) playOrderNotificationSound();
    setMessage(ready ? "Test played. Set this device’s speaker volume high enough for service." : "Sound is blocked. Tap Test sound again and check browser audio permissions.");
  }

  async function enablePush() {
    if (!publicKey) {
      setMessage(pushError || (feedState === "Alerts connected"
        ? "Push keys are unavailable in this deployment. Add WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY and WEB_PUSH_SUBJECT to Vercel, then redeploy."
        : "The alert service has not connected yet. Wait for Alerts connected, or check the connection error shown above."));
      return;
    }
    if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) {
      setMessage("Background push is unavailable here. On iPhone/iPad, add Operations to the Home Screen, open it there, then enable alerts.");
      return;
    }
    setBusy(true); setMessage("");
    // Request permission directly within this user gesture, before any awaits.
    const permissionRequest = Notification.requestPermission();
    try {
      if (await permissionRequest !== "granted") throw new Error("Notifications were not allowed. Change this app’s notification permission in device/browser settings.");
      const worker = await getAdminWorker();
      let subscription = await worker.pushManager.getSubscription();
      if (subscription && subscription.options.applicationServerKey) {
        const existing = new Uint8Array(subscription.options.applicationServerKey);
        const expected = applicationServerKey(publicKey);
        if (existing.length !== expected.length || existing.some((byte, index) => byte !== expected[index])) {await subscription.unsubscribe(); subscription = null;}
      }
      subscription ??= await worker.pushManager.subscribe({userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey)});
      await savePush(subscription);
      renewedPush.current = true;
      setPushStatus("Background alerts enabled on this device for 30 days");
      setMessage("Generic staff notifications can arrive after the app is closed or sign-in expires. Sign-out disables this device’s subscription. Device volume and Focus settings control sound.");
    } catch (error) {setPushStatus("Background alerts not enabled"); setMessage(error instanceof Error ? error.message : "Notifications could not be enabled.");}
    finally {setBusy(false);}
  }

  async function disablePush() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/push", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({csrf: csrfToken, action: "disable"})});
      if (!response.ok) throw new Error("Could not disable background alerts. Please retry.");
      const worker = await getAdminWorker();
      await (await worker.pushManager.getSubscription())?.unsubscribe();
      setPushStatus("Background alerts disabled");
    } catch (error) {setMessage(error instanceof Error ? error.message : "Try again.");}
    finally {setBusy(false);}
  }

  async function testPush() {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator)) throw new Error("Background push is unavailable here.");
      const subscription = await (await getAdminWorker()).pushManager.getSubscription();
      if (!subscription) throw new Error("Enable background alerts on this device first.");
      await savePush(subscription, "test");
      setMessage("Test accepted by the push service. Confirm a notification appears and sounds on this device; device settings control delivery.");
    } catch (error) {setMessage(error instanceof Error ? error.message : "The background test failed.");}
    finally {setBusy(false);}
  }

  async function acknowledge(alert: AdminAlert) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/alerts", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({csrf: csrfToken, id: alert.id}), signal: AbortSignal.timeout(8000)});
      if (!response.ok && response.status !== 409) throw new Error("Acknowledgement was not saved. Please retry.");
      lastFetch.current = 0;
      await refresh();
    } catch (error) {setMessage(error instanceof Error ? error.message : "Acknowledgement failed.");}
    finally {setBusy(false);}
  }

  return <aside className="adminNotificationRail" aria-label="Restaurant alert controls">
    <details className="adminAlertControls">
      <summary><strong>{alerts.length ? `${alerts.length} awaiting acknowledgement` : "Staff alerts"}</strong><span>{!soundEnabled ? "Sound muted" : audioReady ? "Sound ready" : "Tap to enable sound"}</span>{feedState !== "Alerts connected" && <small className="adminAlertWarning">{feedState}</small>}</summary>
      <div className="adminAlertSetup">
        <p role="status">{feedState}</p>
        <div className="adminAlertControlButtons">
          <button type="button" onClick={() => {void testSound();}}>{audioReady && soundEnabled ? "Test loud chime" : "Enable sound & test"}</button>
          {soundEnabled && audioReady && <button type="button" onClick={() => {enabled.current = false; setSoundEnabled(false); stopOrderNotificationSound();}}>Mute this screen</button>}
          <button type="button" disabled={busy || sessionRemaining === 0} onClick={() => {void enablePush();}}>Enable background alerts</button>
          <button type="button" disabled={busy || sessionRemaining === 0} onClick={() => {void testPush();}}>Test background notification</button>
          <button type="button" disabled={busy} onClick={() => {void disablePush();}}>Disable background alerts</button>
          {!installed && installPrompt && <button type="button" onClick={async () => {await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null);}}>Install operations</button>}
          <button type="button" onClick={() => setKeepAwake((value) => !value)}>{keepAwake ? "Allow screen to sleep" : "Keep service screen awake"}</button>
        </div>
        <p>{pushStatus}</p>
        {keepAwake && <p>{awakeState}</p>}
        {!installed && <p>Install from your browser’s app menu. On iPhone/iPad: Share → Add to Home Screen.</p>}
        <p>Foreground chimes repeat every 12 seconds until acknowledged. Background notifications use your device’s notification sound. Keep speakers on and check Focus settings.</p>
        {sessionRemaining < 30 * 60_000 && <p className="adminAlertWarning">{sessionRemaining === 0 ? "Staff sign-in has expired." : "Staff sign-in expires within 30 minutes."} <Link href="/admin/login">Sign in again</Link> to review and acknowledge work. Enabled device push remains subject to staff access and its 30-day renewal.</p>}
        {message && <p role="status">{message}</p>}
      </div>
    </details>
    <div className="adminNotifications" aria-live="polite">
      {alerts.map((alert) => <article className="adminNotification" key={alert.id}>
        <span>Unacknowledged staff alert</span><strong>{alert.title}</strong><p>{new Date(alert.createdAt).toLocaleString("en-GB", {timeZone: "Europe/London"})} · Restaurant time</p>
        <div><Link href={alert.href}>Review</Link><button type="button" disabled={busy || !alert.canAcknowledge} onClick={() => {void acknowledge(alert);}}>Acknowledge</button></div>
      </article>)}
    </div>
  </aside>;
}
