import assert from "node:assert/strict";
import test from "node:test";
import {defaultBookingSettings, validateAdminReservation, validateReservation} from "../app/lib/bookings";
import {validateRequestedTime} from "../app/lib/orders";
import {defaultRestaurantSchedule, formatServiceHours, isRegularClosureDate, isWithinSchedule, scheduleForDate} from "../app/lib/restaurant-schedule";
import {applyScheduleChange, parseScheduleChange} from "../app/lib/schedule-admin";

function futureWeekday(day: number) {
  const date = new Date(Date.now() + 14 * 86_400_000);
  while (date.getUTCDay() !== day) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

test("the regular Monday closure uses the requested restaurant date", () => {
  assert.equal(isRegularClosureDate("2026-09-14"), true);
  assert.equal(isRegularClosureDate("2026-09-15"), false);
  assert.equal(isRegularClosureDate("2026-02-30"), false);
});

test("the confirmed weekly hours match the restaurant listing", () => {
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[0]), "11:00–15:00 · 16:00–21:00");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[1]), "Closed");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[2]), "11:00–15:00 · 16:00–21:00");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[3]), "11:00–15:00 · 16:00–21:00");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[4]), "11:00–15:00 · 16:00–22:00");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[5]), "11:00–22:00");
  assert.equal(formatServiceHours(defaultRestaurantSchedule.weekly[6]), "11:00–15:00 · 16:00–22:00");
});

test("split services reject the afternoon closure and sittings that cross it", () => {
  const tuesday = futureWeekday(2);
  const friday = futureWeekday(5);
  assert.equal(isWithinSchedule(defaultRestaurantSchedule, tuesday, "14:00", 60), true);
  assert.equal(isWithinSchedule(defaultRestaurantSchedule, tuesday, "14:00", 90), false);
  assert.equal(isWithinSchedule(defaultRestaurantSchedule, tuesday, "15:30"), false);
  assert.equal(isWithinSchedule(defaultRestaurantSchedule, tuesday, "16:00"), true);
  assert.equal(isWithinSchedule(defaultRestaurantSchedule, friday, "15:30"), true);
});

test("schedule edits validate optional second-service pairs and overlap", () => {
  assert.throws(() => parseScheduleChange({kind: "weekly", day: 2, closed: false, opens: "11:00", closes: "15:00", secondOpens: "14:30", secondCloses: "21:00"}), /second service/i);
  assert.throws(() => parseScheduleChange({kind: "weekly", day: 2, closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: ""}), /valid service times/i);
  assert.deepEqual(parseScheduleChange({kind: "weekly", day: 2, closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "21:00"}), {kind: "weekly", day: 2, closed: false, opens: "11:00", closes: "15:00", secondOpens: "16:00", secondCloses: "21:00"});
});

test("customer table bookings reject Monday while staff can record an exception", () => {
  const monday = futureWeekday(1);
  const details = {name: "Guest", email: "guest@example.com", phone: "+44 7700 900123", bookingDate: monday, startTime: "18:00", partySize: 2};
  assert.throws(() => validateReservation(details, defaultBookingSettings), /closed on this date/);
  const exception = validateAdminReservation({...details, status: "confirmed", endTime: "19:30"}, defaultBookingSettings);
  assert.equal(exception.bookingDate, monday);
  assert.equal(validateReservation({...details, bookingDate: futureWeekday(2)}, defaultBookingSettings).startTime, "18:00");
});

test("Monday collection and delivery times are rejected before checkout", () => {
  assert.throws(() => validateRequestedTime(`${futureWeekday(1)}T18:00`), /closed on this date/);
  assert.equal(validateRequestedTime(`${futureWeekday(2)}T18:00`), `${futureWeekday(2)}T18:00`);
});

test("a dated Monday opening takes priority over weekly closure for tables and checkout", () => {
  const monday = futureWeekday(1);
  const schedule = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: monday, mode: "open", opens: "12:00", closes: "20:00", secondOpens: "", secondCloses: "", reason: "Holiday service"});
  const details = {name: "Guest", email: "guest@example.com", phone: "+44 7700 900123", bookingDate: monday, startTime: "18:00", partySize: 2};
  assert.equal(scheduleForDate(schedule, monday).exception, true);
  assert.equal(validateReservation(details, defaultBookingSettings, schedule).startTime, "18:00");
  assert.equal(validateRequestedTime(`${monday}T18:00`, schedule), `${monday}T18:00`);
  assert.equal(isWithinSchedule(schedule, monday, "19:30", 90), false);
});

test("a dated closure or reduced day overrides a normal open weekday", () => {
  const tuesday = futureWeekday(2);
  const closed = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: tuesday, mode: "closed", opens: "", closes: "", secondOpens: "", secondCloses: "", reason: "Christmas Day"});
  assert.equal(isWithinSchedule(closed, tuesday, "18:00"), false);
  const reduced = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: tuesday, mode: "reduced", opens: "12:00", closes: "16:00", secondOpens: "", secondCloses: "", reason: "Early finish"});
  assert.equal(isWithinSchedule(reduced, tuesday, "13:00", 90), true);
  assert.equal(isWithinSchedule(reduced, tuesday, "15:00", 90), false);
});
