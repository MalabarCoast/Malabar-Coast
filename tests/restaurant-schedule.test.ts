import assert from "node:assert/strict";
import test from "node:test";
import {defaultBookingSettings, validateAdminReservation, validateReservation} from "../app/lib/bookings";
import {validateRequestedTime} from "../app/lib/orders";
import {defaultRestaurantSchedule, isRegularClosureDate, isWithinSchedule, scheduleForDate} from "../app/lib/restaurant-schedule";
import {applyScheduleChange} from "../app/lib/schedule-admin";

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
  const schedule = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: monday, mode: "open", opens: "12:00", closes: "20:00", reason: "Holiday service"});
  const details = {name: "Guest", email: "guest@example.com", phone: "+44 7700 900123", bookingDate: monday, startTime: "18:00", partySize: 2};
  assert.equal(scheduleForDate(schedule, monday).exception, true);
  assert.equal(validateReservation(details, defaultBookingSettings, schedule).startTime, "18:00");
  assert.equal(validateRequestedTime(`${monday}T18:00`, schedule), `${monday}T18:00`);
  assert.equal(isWithinSchedule(schedule, monday, "19:30", 90), false);
});

test("a dated closure or reduced day overrides a normal open weekday", () => {
  const tuesday = futureWeekday(2);
  const closed = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: tuesday, mode: "closed", opens: "", closes: "", reason: "Christmas Day"});
  assert.equal(isWithinSchedule(closed, tuesday, "18:00"), false);
  const reduced = applyScheduleChange(defaultRestaurantSchedule, {kind: "exception", date: tuesday, mode: "reduced", opens: "12:00", closes: "16:00", reason: "Early finish"});
  assert.equal(isWithinSchedule(reduced, tuesday, "13:00", 90), true);
  assert.equal(isWithinSchedule(reduced, tuesday, "15:00", 90), false);
});
