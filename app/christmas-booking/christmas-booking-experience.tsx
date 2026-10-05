"use client";

import Image from "next/image";
import Link from "next/link";
import {FormEvent, type CSSProperties, useEffect, useRef, useState} from "react";
import {SmartDateInput} from "../components/smart-date-input";
import type {BookingSettings} from "../lib/bookings";
import {reservationSlots} from "../lib/bookings";
import {isWithinSchedule, regularClosureNotice, scheduleNotice, type RestaurantSchedule} from "../lib/restaurant-schedule";
import styles from "./christmas-booking.module.css";
import type {SpecialDayCampaign} from "@/sanity/lib/special-days";

type Confirmation = {
  reference: string;
  startTime: string;
  endTime: string;
  partySize: number;
  bookingDate: string;
};

type CampaignStyle = CSSProperties & Record<`--campaign-${string}`, string>;
const cssImage = (value: string) => `url(${JSON.stringify(value.replace(/[\r\n]/g, ""))})`;

export function SpecialDayBookingExperience({campaign, settings, schedule}: {campaign: SpecialDayCampaign; settings: BookingSettings; schedule: RestaurantSchedule}) {
  const [effectEnabled, setEffectEnabled] = useState(campaign.ambientEffect !== "none");
  const [jinglePlaying, setJinglePlaying] = useState(false);
  const [story, setStory] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedParty, setSelectedParty] = useState(Math.max(2, settings.minimumPartySize));
  const [liveSchedule, setLiveSchedule] = useState(schedule);
  const audioContext = useRef<AudioContext | null>(null);
  const uploadedJingle = useRef<HTMLAudioElement | null>(null);
  const jingleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [{minimumDate, maximumDate}] = useState(() => ({
    minimumDate: new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date()),
    maximumDate: new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date(Date.now() + settings.advanceDays * 86_400_000)),
  }));

  const closedDate = Boolean(selectedDate) && !isWithinSchedule(liveSchedule, selectedDate);
  const invalidTime = Boolean(selectedDate && selectedTime) && !isWithinSchedule(liveSchedule, selectedDate, selectedTime, settings.sittingMinutes);

  useEffect(() => {
    let active = true;
    fetch("/api/schedule", {cache: "no-store"})
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (active && data?.schedule) setLiveSchedule(data.schedule); })
      .catch(() => undefined);
    return () => {
      active = false;
      if (jingleTimer.current) clearTimeout(jingleTimer.current);
      uploadedJingle.current?.pause();
      void audioContext.current?.close();
    };
  }, []);

  async function playJingle() {
    if (jinglePlaying) return;
    if (campaign.jingleUrl) {
      const audio = new Audio(campaign.jingleUrl);
      uploadedJingle.current = audio;
      setJinglePlaying(true);
      const finish = () => {
        setJinglePlaying(false);
        uploadedJingle.current = null;
      };
      audio.addEventListener("ended", finish, {once: true});
      audio.addEventListener("error", finish, {once: true});
      try { await audio.play(); } catch { finish(); }
      return;
    }
    const context = new AudioContext();
    audioContext.current = context;
    await context.resume();
    const melody = [
      [659, 0, .18], [659, .24, .18], [659, .48, .38], [659, .98, .18], [659, 1.22, .18], [659, 1.46, .38],
      [659, 1.96, .18], [784, 2.20, .18], [523, 2.44, .18], [587, 2.68, .18], [659, 2.92, .55],
      [698, 3.64, .18], [698, 3.88, .18], [698, 4.12, .18], [698, 4.36, .18], [698, 4.60, .18],
      [659, 4.84, .18], [659, 5.08, .18], [659, 5.32, .18], [587, 5.56, .18], [587, 5.80, .18], [659, 6.04, .18], [587, 6.28, .38], [784, 6.76, .38],
    ];
    setJinglePlaying(true);
    melody.forEach(([frequency, start, duration], index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index % 3 === 0 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration + .04);
    });
    jingleTimer.current = setTimeout(() => {
      setJinglePlaying(false);
      void context.close();
      audioContext.current = null;
    }, 7350);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });
      const result = await response.json() as Partial<Confirmation> & {error?: string};
      if (!response.ok || !result.reference || !result.bookingDate || !result.startTime || !result.endTime || !result.partySize) {
        throw new Error(result.error || "The booking could not be completed.");
      }
      setConfirmation(result as Confirmation);
      form.reset();
      setSelectedDate("");
      setSelectedTime("");
      setSelectedParty(Math.max(2, settings.minimumPartySize));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The booking could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  const campaignStyle: CampaignStyle = {
    "--campaign-night": campaign.palette.night,
    "--campaign-evergreen": campaign.palette.evergreen,
    "--campaign-berry": campaign.palette.berry,
    "--campaign-gold": campaign.palette.gold,
    "--campaign-cream": campaign.palette.cream,
    "--campaign-ink": campaign.palette.ink,
    "--campaign-hero-desktop": cssImage(campaign.desktopHero.url),
    "--campaign-hero-mobile": cssImage(campaign.mobileHero?.url || campaign.desktopHero.url),
  };
  const effectLabel = campaign.ambientEffect === "petals" ? "Petals" : "Snow";
  const emblemClass = campaign.emblemStyle === "floral" ? styles.floralMark : campaign.emblemStyle === "classic" ? styles.classicMark : styles.winterMark;

  return <main className={styles.page} style={campaignStyle}>
    <section className={styles.hero} aria-labelledby="special-day-booking-title">
      <div className={styles.heroArtwork} aria-hidden="true"/>
      {campaign.ambientEffect !== "none" && <div className={`${styles.snow} ${campaign.ambientEffect === "petals" ? styles.petalEffect : ""} ${effectEnabled ? styles.snowOn : ""}`} aria-hidden="true"/>}
      <div className={styles.heroShade} aria-hidden="true"/>
      <div className={styles.heroInner}>
        <Link className={styles.backLink} href="/"><span aria-hidden="true">←</span> Malabar Coast home</Link>
        <div className={`${styles.festiveMark} ${emblemClass}`}>
          <span className={styles.logoHat} aria-hidden="true"/>
          <span className={styles.wreath} aria-hidden="true"/>
          <span className={styles.logoPlate}><Image src="/malabar.png" alt="Malabar Coast" width={2384} height={2403} priority/></span>
          <span className={styles.logoRibbon}>{campaign.logoRibbon}</span>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.greeting}>{campaign.greeting}</p>
          <h1 id="special-day-booking-title">{campaign.heroHeading}{campaign.heroAccent && <><br/><em>{campaign.heroAccent}</em></>}</h1>
          <p className={styles.lede}>{campaign.heroText}</p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#special-day-reservation">{campaign.primaryActionLabel} <span aria-hidden="true">↓</span></a>
            {campaign.enableSound && <button type="button" className={styles.soundAction} onClick={playJingle} disabled={jinglePlaying} aria-label="Play the campaign sound">
              {jinglePlaying ? "Playing…" : campaign.soundActionLabel || "Play the jingle"}
            </button>}
            {campaign.ambientEffect !== "none" && <button type="button" className={styles.snowAction} onClick={() => setEffectEnabled((value) => !value)} aria-pressed={effectEnabled}>
              {effectLabel} {effectEnabled ? "on" : "off"}
            </button>}
          </div>
        </div>
        <div className={styles.scrollCue}><span>{campaign.scrollLabel || "Continue to booking"}</span></div>
      </div>
    </section>

    <section className={styles.festivalStrip} aria-label={`${campaign.title} story`}>
      <div className={styles.storyIntro}><p>{campaign.storyEyebrow}</p><h2>{campaign.storyHeading}</h2></div>
      <div className={styles.storyStickers} role="tablist" aria-label="Campaign details">
        {campaign.storyItems.map((item, index) => <button key={item._key} type="button" role="tab" aria-selected={story === index} className={story === index ? styles.activeSticker : ""} onClick={() => setStory(index)}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><b>{item.title}</b></button>)}
      </div>
      <p className={styles.storyCopy} role="tabpanel">{campaign.storyItems[story]?.copy}</p>
    </section>

    <section className={styles.bookingSection} id="special-day-reservation">
      <aside className={styles.bookingAside}>
        <p className={styles.kicker}>{campaign.bookingEyebrow}</p>
        <h2>{campaign.bookingHeading}</h2>
        <p>{campaign.bookingText}</p>
        <dl className={styles.bookingFacts}>
          <div><dt>{settings.sittingMinutes} min</dt><dd>Your table is reserved</dd></div>
          <div><dt>Up to {settings.maximumPartySize}</dt><dd>Guests online</dd></div>
          <div><dt>{Math.ceil(settings.minimumLeadMinutes / 60)} hrs</dt><dd>Minimum notice</dd></div>
        </dl>
        {(campaign.promiseTitle || campaign.promiseText) && <div className={styles.promise}><p><b>{campaign.promiseTitle}</b>{campaign.promiseText}</p></div>}
      </aside>

      <div className={styles.bookingCard}>
        <div className={styles.cardGarland} aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
        {confirmation ? <div className={styles.confirmation} role="status">
          <p>{campaign.confirmationEyebrow || "Your booking is on the calendar"}</p>
          <h2>{campaign.confirmationHeading}</h2>
          <div className={styles.confirmationTicket}>
            <span>Booking reference</span><strong>{confirmation.reference}</strong>
            <dl><div><dt>Date</dt><dd>{confirmation.bookingDate}</dd></div><div><dt>Time</dt><dd>{confirmation.startTime}–{confirmation.endTime}</dd></div><div><dt>Guests</dt><dd>{confirmation.partySize}</dd></div></dl>
          </div>
          <p className={styles.confirmationNote}>Keep this reference safe. Our team will use the contact details you supplied if we need to speak with you.</p>
          <button type="button" onClick={() => setConfirmation(null)}>Make another booking <span aria-hidden="true">→</span></button>
        </div> : <>
          <header className={styles.cardHeader}><div><p>{campaign.logoRibbon}</p><h2>{campaign.formHeading}</h2></div><span aria-hidden="true">01—03</span></header>
          <form className={styles.form} onSubmit={submit}>
            <fieldset>
              <legend><span>01</span> Choose your table</legend>
              <div className={styles.formGrid}>
                <label>Booking date<SmartDateInput name="bookingDate" min={minimumDate} max={maximumDate} onChange={(event) => setSelectedDate(event.target.value)} required/></label>
                <label>Arrival time<select name="startTime" required defaultValue="" disabled={closedDate} onChange={(event) => setSelectedTime(event.target.value)}><option value="" disabled>Select a time</option>{reservationSlots(settings).map((slot) => <option key={slot} disabled={Boolean(selectedDate) && !isWithinSchedule(liveSchedule, selectedDate, slot, settings.sittingMinutes)}>{slot}</option>)}</select></label>
                <label>Number of guests<select name="partySize" value={selectedParty} onChange={(event) => setSelectedParty(Number(event.target.value))} required>{Array.from({length: settings.maximumPartySize - settings.minimumPartySize + 1}, (_, index) => settings.minimumPartySize + index).map((count) => <option key={count} value={count}>{count} guest{count === 1 ? "" : "s"}</option>)}</select></label>
                <label>Gathering<select name="occasion" defaultValue={campaign.occasionLabel}><option>{campaign.occasionLabel}</option><option>Family celebration</option><option>Work meal</option><option>Date night</option><option>Friends&apos; get-together</option><option>Other</option></select></label>
              </div>
              <p className={styles.scheduleNote}>{regularClosureNotice} Holiday hours appear in the live calendar.</p>
              {(closedDate || invalidTime) && <p className={styles.formMessage} role="alert">{scheduleNotice(liveSchedule, selectedDate)} Please choose another date or time.</p>}
            </fieldset>

            <fieldset>
              <legend><span>02</span> Your details</legend>
              <div className={styles.formGrid}>
                <label>Full name<input name="name" autoComplete="name" maxLength={100} required/></label>
                <label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} required/></label>
                <label className={styles.formWide}>Email address<input name="email" type="email" autoComplete="email" maxLength={160} required/></label>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>03</span> Help us prepare</legend>
              <details className={styles.optionalDetails}>
                <summary>Add dietary, accessibility or seating notes <span aria-hidden="true">＋</span></summary>
                <div className={styles.formGrid}>
                  <label className={styles.formWide}>Dietary requirements<textarea name="dietaryRequirements" maxLength={400} placeholder="Allergies or dietary needs. Please speak to the team for severe allergies."/></label>
                  <label className={styles.formWide}>Accessibility requirements<textarea name="accessibilityNeeds" maxLength={400} placeholder="Wheelchair space, high chair or anything else that helps us prepare."/></label>
                  <label className={styles.formWide}>Anything else?<textarea name="notes" maxLength={600} placeholder="Seating preferences, celebrations or notes for our team."/></label>
                </div>
              </details>
            </fieldset>

            <div className={styles.liveSummary} aria-live="polite"><p><b>{selectedParty} seat{selectedParty === 1 ? "" : "s"}</b>{selectedDate && selectedTime ? `${selectedDate} at ${selectedTime}` : "Choose a date and time above"}</p></div>
            <label className={styles.consent}><input type="checkbox" required/><span>I confirm these details are correct and understand the restaurant may contact me about this booking.</span></label>
            {message && <p className={styles.formMessage} role="alert">{message}</p>}
            <button className={styles.submitButton} type="submit" disabled={submitting || !settings.bookingEnabled || closedDate || invalidTime}><span>{submitting ? "Checking the table…" : settings.bookingEnabled ? campaign.submitLabel : "Booking paused"}</span></button>
          </form>
        </>}
      </div>
    </section>

    <section className={styles.closing}>
      <p>{campaign.closingEyebrow}</p><h2>{campaign.closingHeading}</h2>{campaign.closingLink && <Link href={campaign.closingLink.href} target={campaign.closingLink.openInNewTab ? "_blank" : undefined} rel={campaign.closingLink.openInNewTab ? "noreferrer" : undefined}>{campaign.closingLink.label} <span aria-hidden="true">↗</span></Link>}
    </section>
  </main>;
}
