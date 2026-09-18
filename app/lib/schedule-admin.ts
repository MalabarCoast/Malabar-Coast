import {createHash} from "node:crypto";
import {listHallEnquiriesInDateRange, listReservationsInDateRange} from "./booking-store";
import {listOrdersPage} from "./order-store";
import {inferPaymentStatus} from "./orders";
import {dayNames, isValidScheduleDate, isValidServiceHours, isWithinSchedule, type RestaurantSchedule, type ScheduleException} from "./restaurant-schedule";

export type ScheduleChange =
  | {kind: "weekly"; day: number; closed: boolean; opens: string; closes: string; secondOpens: string; secondCloses: string}
  | {kind: "exception"; date: string; mode: ScheduleException["mode"] | "remove"; opens: string; closes: string; secondOpens: string; secondCloses: string; reason: string};

export function parseScheduleChange(value: unknown): ScheduleChange {
  if (!value || typeof value !== "object") throw new Error("Schedule change is missing.");
  const input = value as Record<string, unknown>;
  const opens = String(input.opens || "");
  const closes = String(input.closes || "");
  const secondOpens = String(input.secondOpens || "");
  const secondCloses = String(input.secondCloses || "");
  const hours = {opens, closes, secondOpens, secondCloses};
  if (input.kind === "weekly") {
    const day = Number(input.day);
    if (!Number.isInteger(day) || day < 0 || day >= dayNames.length || typeof input.closed !== "boolean") throw new Error("Choose a valid weekday.");
    if (!input.closed && !isValidServiceHours(hours, true)) throw new Error("Enter valid service times. A second service must begin after the first one closes.");
    return {kind: "weekly", day, closed: input.closed, opens: input.closed ? "" : opens, closes: input.closed ? "" : closes, secondOpens: input.closed ? "" : secondOpens, secondCloses: input.closed ? "" : secondCloses};
  }
  if (input.kind === "exception") {
    const date = String(input.date || "");
    const mode = String(input.mode || "");
    if (!isValidScheduleDate(date) || !["closed", "open", "reduced", "remove"].includes(mode)) throw new Error("Choose a valid date and opening mode.");
    const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
    if (date < today) throw new Error("Choose today or a future date.");
    if ((mode === "open" || mode === "reduced") && !isValidServiceHours(hours)) throw new Error("Exceptional opening needs valid service times. A second service must begin after the first one closes.");
    const clearHours = mode === "closed" || mode === "remove";
    return {kind: "exception", date, mode: mode as ScheduleException["mode"] | "remove", opens: clearHours ? "" : opens, closes: clearHours ? "" : closes, secondOpens: clearHours ? "" : secondOpens, secondCloses: clearHours ? "" : secondCloses, reason: String(input.reason || "").trim().slice(0, 180)};
  }
  throw new Error("Choose a schedule change.");
}

export function applyScheduleChange(schedule: RestaurantSchedule, change: ScheduleChange): RestaurantSchedule {
  const next = structuredClone(schedule);
  if (change.kind === "weekly") next.weekly[change.day] = {closed: change.closed, opens: change.opens, closes: change.closes, secondOpens: change.secondOpens, secondCloses: change.secondCloses};
  else {
    next.exceptions = next.exceptions.filter((item) => item.date !== change.date);
    if (change.mode !== "remove") next.exceptions.push({date: change.date, mode: change.mode, closed: change.mode === "closed", opens: change.opens, closes: change.closes, secondOpens: change.secondOpens, secondCloses: change.secondCloses, reason: change.reason});
    next.exceptions.sort((a, b) => a.date.localeCompare(b.date));
  }
  return next;
}

export type ScheduleImpact = {type: "Table" | "Paid order" | "Hall enquiry"; reference: string; date: string; time: string; name: string; detail: string; href: string};

export async function scheduleImpact(schedule: RestaurantSchedule, change: ScheduleChange): Promise<ScheduleImpact[]> {
  const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 366);
  const lastDate = end.toISOString().slice(0, 10);
  const inScope = (date: string) => change.kind === "exception" ? date === change.date : date >= today && isValidScheduleDate(date) && new Date(`${date}T12:00:00Z`).getUTCDay() === change.day;
  const rangeStart = change.kind === "exception" ? change.date : today;
  const rangeEnd = change.kind === "exception" ? change.date : "9999-12-31";
  const [reservations, hallEnquiries] = await Promise.all([listReservationsInDateRange(rangeStart, rangeEnd), listHallEnquiriesInDateRange(rangeStart, rangeEnd)]);
  const impact: ScheduleImpact[] = [];
  for (const item of reservations) if (item.status === "confirmed" && inScope(item.bookingDate) && !isWithinSchedule(schedule, item.bookingDate, item.startTime, (Number(item.endTime.slice(0, 2)) * 60 + Number(item.endTime.slice(3, 5))) - (Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5))))) impact.push({type: "Table", reference: item.reference, date: item.bookingDate, time: item.startTime, name: item.name, detail: `${item.partySize} guests`, href: "/admin/reservations"});
  for (const item of hallEnquiries) if (item.status === "approved" && inScope(item.preferredDate) && !isWithinSchedule(schedule, item.preferredDate)) impact.push({type: "Hall enquiry", reference: item.reference, date: item.preferredDate, time: item.preferredTime || "Time flexible", name: item.name, detail: `${item.guestCount || "Unknown"} guests`, href: "/admin/hall-enquiries"});
  const from = change.kind === "exception" ? `${change.date}T00:00` : `${today}T00:00`;
  const to = change.kind === "exception" ? `${change.date}T23:59:59` : `${lastDate}T23:59:59`;
  for (let offset = 0; ; offset += 1000) {
    const orders = await listOrdersPage({limit: 1000, offset, requestedFrom: from, requestedTo: to});
    for (const item of orders) if (inferPaymentStatus(item) === "paid" && inScope(item.requestedTime.slice(0, 10)) && !isWithinSchedule(schedule, item.requestedTime.slice(0, 10), item.requestedTime.slice(11))) impact.push({type: "Paid order", reference: item.id.slice(-8).toUpperCase(), date: item.requestedTime.slice(0, 10), time: item.requestedTime.slice(11), name: item.customer.name, detail: item.fulfilment, href: `/admin/orders/${item.id}`});
    if (orders.length < 1000) break;
  }
  return impact.sort((a, b) => `${a.date}${a.time}${a.reference}`.localeCompare(`${b.date}${b.time}${b.reference}`));
}

export function schedulePreviewToken(schedule: RestaurantSchedule, change: ScheduleChange, impact: ScheduleImpact[]) {
  return createHash("sha256").update(JSON.stringify({revision: schedule.revision ?? 0, change, impact})).digest("hex");
}
