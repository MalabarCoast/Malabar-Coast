import assert from "node:assert/strict";
import test from "node:test";
import {defaultBookingSettings, validateAdminReservation, validateReservation} from "../app/lib/bookings";
import {validateRequestedTime} from "../app/lib/orders";
import {isRegularClosureDate} from "../app/lib/restaurant-schedule";

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
  assert.throws(() => validateReservation(details, defaultBookingSettings), /closed on Mondays/);
  const exception = validateAdminReservation({...details, status: "confirmed", endTime: "19:30"}, defaultBookingSettings);
  assert.equal(exception.bookingDate, monday);
  assert.equal(validateReservation({...details, bookingDate: futureWeekday(2)}, defaultBookingSettings).startTime, "18:00");
});

test("Monday collection and delivery times are rejected before checkout", () => {
  assert.throws(() => validateRequestedTime(`${futureWeekday(1)}T18:00`), /unavailable on Mondays/);
  assert.equal(validateRequestedTime(`${futureWeekday(2)}T18:00`), `${futureWeekday(2)}T18:00`);
});
