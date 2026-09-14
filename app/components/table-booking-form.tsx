"use client";
import { FormEvent, useEffect, useState } from "react";
import type { BookingSettings } from "../lib/bookings";
import { reservationSlots } from "../lib/bookings";
import { isWithinSchedule, regularClosureNotice, scheduleNotice, type RestaurantSchedule } from "../lib/restaurant-schedule";
import styles from "./booking-forms.module.css";
import {SmartDateInput} from "./smart-date-input";

export function TableBookingForm({ settings, schedule, compact = false }: { settings: BookingSettings; schedule: RestaurantSchedule; compact?: boolean }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [liveSchedule, setLiveSchedule] = useState(schedule);
  const closedDate = Boolean(selectedDate) && !isWithinSchedule(liveSchedule, selectedDate);
  const invalidTime = Boolean(selectedDate && selectedTime) && !isWithinSchedule(liveSchedule, selectedDate, selectedTime, settings.sittingMinutes);
  useEffect(() => {
    let active = true;
    fetch("/api/schedule", {cache: "no-store"}).then((response) => response.ok ? response.json() : null).then((data) => { if (active && data?.schedule) setLiveSchedule(data.schedule); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const [{ minimumDate, maximumDate }] = useState(() => ({
    minimumDate: new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date()),
    maximumDate: new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date(Date.now() + settings.advanceDays * 86_400_000)),
  }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setMessage(null);
    const form = event.currentTarget; const data = new FormData(form);
    try {
      const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data.entries())) });
      const result = await response.json() as { error?: string; reference?: string; startTime?: string; endTime?: string; partySize?: number };
      if (!response.ok) throw new Error(result.error || "The booking could not be completed.");
      setMessage({ success: `Your table is confirmed. Reference ${result.reference}, ${result.startTime}–${result.endTime} for ${result.partySize} guest${result.partySize === 1 ? "" : "s"}.` });
      form.reset();
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) { setMessage({ error: error instanceof Error ? error.message : "The booking could not be completed." }); }
    finally { setSubmitting(false); }
  }
  return <form className={`${styles.form} ${compact ? styles.compact : ""}`} onSubmit={submit}>
    <div className={styles.grid}>
      <label>Full name<input name="name" autoComplete="name" maxLength={100} required /></label>
      <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label>
      <label className={styles.full}>Email address<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
      <label>Booking date<SmartDateInput name="bookingDate" min={minimumDate} max={maximumDate} onChange={(event) => setSelectedDate(event.target.value)} required /></label>
      <label>Arrival time<select name="startTime" required defaultValue="" disabled={closedDate} onChange={(event) => setSelectedTime(event.target.value)}><option value="" disabled>Select a time</option>{reservationSlots(settings).map((slot) => <option key={slot} disabled={Boolean(selectedDate) && !isWithinSchedule(liveSchedule, selectedDate, slot, settings.sittingMinutes)}>{slot}</option>)}</select></label>
      <label>Number of guests<select name="partySize" required defaultValue="2">{Array.from({ length: settings.maximumPartySize - settings.minimumPartySize + 1 }, (_, index) => settings.minimumPartySize + index).map((count) => <option key={count} value={count}>{count} guest{count === 1 ? "" : "s"}</option>)}</select></label>
      {!compact && <><label>Occasion<input name="occasion" maxLength={80} placeholder="Birthday, anniversary…" /></label>
      <label className={styles.full}>Dietary requirements<textarea name="dietaryRequirements" maxLength={400} placeholder="Allergies or dietary needs. Please speak to the team for severe allergies." /></label>
      <label className={styles.full}>Accessibility requirements<textarea name="accessibilityNeeds" maxLength={400} placeholder="Wheelchair space, high chair or anything else that helps us prepare." /></label>
      <label className={styles.full}>Anything else?<textarea name="notes" maxLength={600} placeholder="Seating preferences or notes for front of house." /></label></>}
    </div>
    <p className={styles.scheduleNote}>{regularClosureNotice} Check the calendar for holiday hours.</p>
    {(closedDate || invalidTime) && <p className={styles.message} role="alert">{scheduleNotice(liveSchedule, selectedDate)} Please choose another date or time.</p>}
    <div className={styles.summary}><strong>{settings.capacity} seats managed per sitting</strong><span>Your table is held for {settings.sittingMinutes} minutes. Availability is checked securely when you submit.</span></div>
    <label className={styles.consent}><input type="checkbox" required /><span>I confirm these details are correct and understand the restaurant may contact me about this booking.</span></label>
    {message?.error && <p className={styles.message} role="alert">{message.error}</p>}
    {message?.success && <p className={`${styles.message} ${styles.success}`} role="status">{message.success}</p>}
    <button className={styles.button} disabled={submitting || !settings.bookingEnabled || closedDate || invalidTime}>{submitting ? "Checking the table…" : settings.bookingEnabled ? "Confirm table" : "Booking paused"}<span aria-hidden="true">→</span></button>
  </form>;
}
