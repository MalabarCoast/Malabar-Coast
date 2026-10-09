import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {applyImmediateServiceChange, deleteServiceClosure, parseServiceClosure, saveServiceClosure} from "../app/lib/service-availability-admin";
import {convertZonedDateTime, defaultServiceAvailability, publicServiceAvailability, resolveServiceAvailability} from "../app/lib/service-availability";

test("admin schedule times convert between the device and restaurant timezones", () => {
  assert.equal(convertZonedDateTime("2026-10-09T16:20", "Asia/Calcutta", "Europe/London"), "2026-10-09T11:50");
  assert.equal(convertZonedDateTime("2026-10-09T11:50", "Europe/London", "Asia/Calcutta"), "2026-10-09T16:20");
});

test("each customer channel can be closed independently or in a group", () => {
  const config = applyImmediateServiceChange(structuredClone(defaultServiceAvailability), {
    channels: ["table", "hall"], enabled: false, message: "Private event in progress.",
  });
  assert.equal(resolveServiceAvailability(config, "table").enabled, false);
  assert.equal(resolveServiceAvailability(config, "hall").message, "Private event in progress.");
  assert.equal(resolveServiceAvailability(config, "collection").enabled, true);
  assert.equal(resolveServiceAvailability(config, "delivery").enabled, true);
});

test("a scheduled closure activates and reopens automatically in restaurant local time", () => {
  const closure = parseServiceClosure({
    channels: ["collection", "delivery"],
    startsAt: "2099-12-24T17:00",
    endsAt: "2099-12-26T11:30",
    reason: "Christmas break",
    message: "Online ordering returns on Boxing Day.",
  }, "svc_abcdefghijklmnop");
  const config = saveServiceClosure(structuredClone(defaultServiceAvailability), closure);
  assert.equal(publicServiceAvailability(config, "2099-12-24T16:59").collection.enabled, true);
  assert.deepEqual(resolveServiceAvailability(config, "delivery", "2099-12-25T12:00"), {
    channel: "delivery", enabled: false, source: "scheduled", message: "Online ordering returns on Boxing Day.", until: "2099-12-26T11:30", closureId: closure.id,
  });
  assert.equal(publicServiceAvailability(config, "2099-12-26T11:30").delivery.enabled, true);
  assert.equal(deleteServiceClosure(config, closure.id).closures.length, 0);
});

test("opening a service now removes it from an active grouped closure", () => {
  const now = new Date();
  const startsAt = new Date(now.getTime() - 60_000);
  const endsAt = new Date(now.getTime() + 60 * 60_000);
  const local = (date: Date) => new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).format(date).replace(" ", "T");
  const config = saveServiceClosure(structuredClone(defaultServiceAvailability), {
    id: "svc_abcdefghijklmnop", channels: ["collection", "delivery"], startsAt: local(startsAt), endsAt: local(endsAt), reason: "Busy kitchen", message: "Ordering paused.",
  });
  const reopened = applyImmediateServiceChange(config, {channels: ["collection"], enabled: true});
  assert.equal(resolveServiceAvailability(reopened, "collection").enabled, true);
  assert.equal(resolveServiceAvailability(reopened, "delivery").enabled, false);
  assert.deepEqual(reopened.closures[0].channels, ["delivery"]);
});

test("invalid or expired closure windows are rejected", () => {
  assert.throws(() => parseServiceClosure({channels: ["table"], startsAt: "2099-01-02T10:00", endsAt: "2099-01-02T09:00"}, "svc_abcdefghijklmnop"), /after the closure starts/i);
  assert.throws(() => parseServiceClosure({channels: [], startsAt: "2099-01-02T09:00", endsAt: "2099-01-02T10:00"}, "svc_abcdefghijklmnop"), /at least one service/i);
});

test("all public submission routes enforce live service availability", async () => {
  const [checkout, reservations, hall] = await Promise.all([
    readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/reservations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/hall-enquiries/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(checkout, /assertServiceAvailable\(validatedCheckout\.fulfilment\)/);
  assert.match(reservations, /assertServiceAvailable\("table"\)/);
  assert.match(hall, /assertServiceAvailable\("hall"\)/);
});

test("open customer forms refresh availability while a scheduled boundary passes", async () => {
  const files = await Promise.all([
    readFile(new URL("../app/components/table-booking-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/christmas-booking/christmas-booking-experience.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/hall-enquiry-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/checkout-form.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of files) {
    assert.match(source, /setInterval\(refreshAvailability, serviceAvailabilityRefreshMs\)/);
    assert.match(source, /clearInterval\(availabilityTimer\)/);
  }
});
