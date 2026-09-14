import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {validateCareer} from "../app/lib/careers";
import {reservationCancellationEmail} from "../app/lib/email/notifications";
import type {TableReservation} from "../app/lib/bookings";

test("a cancellation email contains the guest, booking ID and service details", () => {
  const booking: TableReservation = {id: "res_abcdefghijklmnop", reference: "MC-TABLE-1234ABCD", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-14T12:00:00Z", status: "cancelled", name: "Asha Guest", email: "asha@example.com", phone: "+44 7700 900123", bookingDate: "2026-09-14", startTime: "15:30", endTime: "17:00", partySize: 8, occasion: "", accessibilityNeeds: "", dietaryRequirements: "", notes: "", adminNotes: "Private staff note"};
  const message = reservationCancellationEmail(booking);
  assert.equal(message.to.email, booking.email);
  for (const detail of [booking.name, booking.reference, "Monday, 14 September 2026", "15:30", "8"]) assert.match(message.text, new RegExp(detail));
  assert.doesNotMatch(message.text, /Private staff note/);
  assert.match(message.html, /Book another table/);
});

test("a publishable job requires application details and skills", () => {
  const job = {title: "Chef de Partie", team: "Kitchen", location: "Holytown", employmentType: "Full-time", hours: "40 hours", pay: "Discussed at interview", summary: "Work with coastal flavours.", responsibilities: "Prepare dishes", skills: "Kitchen experience", benefits: "Staff meals", applicationEmail: "jobs@example.com", closingDate: "", status: "published"};
  assert.equal(validateCareer(job).title, "Chef de Partie");
  assert.throws(() => validateCareer({...job, skills: ""}), /skills is required/);
  assert.throws(() => validateCareer({...job, applicationEmail: "invalid"}), /valid application email/);
});

test("PWA icons include installable PNG sizes and the public worker excludes private routes", async () => {
  const [small, large, worker] = await Promise.all([readFile(new URL("../public/icon-192.png", import.meta.url)), readFile(new URL("../public/icon-512.png", import.meta.url)), readFile(new URL("../public/sw.js", import.meta.url), "utf8")]);
  assert.equal(small.readUInt32BE(16), 192);
  assert.equal(small.readUInt32BE(20), 192);
  assert.equal(large.readUInt32BE(16), 512);
  assert.equal(large.readUInt32BE(20), 512);
  assert.match(worker, /admin\|api\|checkout\|order/);
  assert.doesNotMatch(worker, /cache\.put\(request/);
});
