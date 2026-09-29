"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {TestimonialRecord} from "@/sanity/lib/testimonials";

const CARD_CYCLE_MS = 4600;
const CYCLE_RESUME_DELAY_MS = 1100;
const VISIBLE_STACK_DEPTH = 3;

const testimonialRecords = [
  {
    rating: "4.75",
    ratingLabel: "Rated 4.75 out of 5",
    ratingCount: "8 public ratings",
    text: "Eight early diners have already placed Malabar Coast at 4.75 out of 5, a warm first word from Holytown.",
    author: "Just Eat guests",
    role: "Independent delivery platform",
    sources: [{ url: "https://www.just-eat.co.uk/area/ML1-Holytown", label: "View source" }],
  },
  {
    rating: "5.0",
    ratingLabel: "Rated 5 out of 5",
    ratingCount: "2 public ratings",
    text: "The first two ratings arrived as a perfect 5.0 out of 5, carrying the earliest taste of the kitchen beyond our doors.",
    author: "Uber Eats guests",
    role: "Independent delivery platform",
    sources: [{ url: "https://www.ubereats.com/gb/store/malabar-coast/fLSpFqDpXgaMbY7XNRZDVQ", label: "View source" }],
  },
  {
    rating: "4.80",
    ratingLabel: "Combined rating of 4.8 out of 5",
    ratingCount: "10 ratings across two platforms",
    text: "Taken together, the ten published ratings average 4.8 out of 5, a transparent combined view of the early guest response.",
    author: "Combined guest score",
    role: "Calculated from the two public records above",
    sources: [
      { url: "https://www.just-eat.co.uk/area/ML1-Holytown", label: "Just Eat" },
      { url: "https://www.ubereats.com/gb/store/malabar-coast/fLSpFqDpXgaMbY7XNRZDVQ", label: "Uber Eats" },
    ],
  },
  {
    rating: "4.75+",
    ratingLabel: "Both platform ratings are at least 4.75 out of 5",
    ratingCount: "2 independent platform records",
    text: "Both published platform scores sit at 4.75 or higher, giving the opening guest book a consistently strong first chapter.",
    author: "Across the guest book",
    role: "Cross-platform rating summary",
    sources: [
      { url: "https://www.just-eat.co.uk/area/ML1-Holytown", label: "Just Eat" },
      { url: "https://www.ubereats.com/gb/store/malabar-coast/fLSpFqDpXgaMbY7XNRZDVQ", label: "Uber Eats" },
    ],
  },
] as const;

export function HomeTestimonials({records = testimonialRecords}: {records?: readonly TestimonialRecord[]}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current === null) return;
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
  }, []);

  useEffect(() => {
    if (isPaused || records.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cycleTimer = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % records.length);
    }, CARD_CYCLE_MS);

    return () => window.clearInterval(cycleTimer);
  }, [isPaused, records.length]);

  useEffect(() => () => clearResumeTimer(), [clearResumeTimer]);

  const pauseCarousel = () => {
    clearResumeTimer();
    setIsPaused(true);
  };

  const resumeCarousel = () => {
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
      resumeTimerRef.current = null;
    }, CYCLE_RESUME_DELAY_MS);
  };

  const showCard = (index: number) => {
    setActiveIndex(index);
    pauseCarousel();
    resumeCarousel();
  };

  if (!records.length) return null;

  return (
    <section
      className="homeTestimonials"
      id="testimonials"
      aria-labelledby="home-testimonials-title"
    >
      <div className="homeTestimonialsMeta">
        <span>Gallery V · The guest book</span>
        <span>Holytown · MMXXVI</span>
      </div>

      <header className="homeTestimonialsHeading">
        <p>Words preserved at the table</p>
        <h2 id="home-testimonials-title">
          <span>Leaves from</span>
          <em>the guest book.</em>
        </h2>
      </header>

      <div
        className="homeTestimonialsArchive"
        aria-label="Guest records"
        onMouseEnter={pauseCarousel}
        onMouseLeave={resumeCarousel}
        onFocusCapture={pauseCarousel}
        onBlurCapture={resumeCarousel}
      >
        <div className="homeTestimonialsHalo" aria-hidden="true" />
        <div className="homeTestimonialBackplates" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {records.map((record, index) => {
          const isActive = activeIndex === index;
          const depth = (index - activeIndex + records.length) % records.length;
          const isQueued = depth > 0 && depth <= VISIBLE_STACK_DEPTH;
          const stackOffset = depth % 2 === 0 ? depth * -.7 : depth * .7;

          return (
            <article
              className={`homeTestimonialCard ${isActive ? "isActive" : isQueued ? "isQueued" : "isHidden"}`}
              key={record.author}
              tabIndex={isActive ? 0 : -1}
              aria-current={isActive ? "true" : undefined}
              aria-hidden={!isActive}
              style={{
                "--stack-depth": Math.min(depth, VISIBLE_STACK_DEPTH + 1),
                "--stack-offset": `${stackOffset}rem`,
                "--stack-rotation": `${stackOffset * .32}deg`,
              } as React.CSSProperties}
            >
              <span className="homeTestimonialIndex" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="homeTestimonialRating" aria-label={record.ratingLabel}>
                <span className="homeTestimonialScore">
                  <strong>{record.rating}</strong><small>/ 5</small>
                </span>
                <span className="homeTestimonialCount">{record.ratingCount}</span>
              </div>
              <blockquote>
                <span className="homeTestimonialQuoteMark" aria-hidden="true">“</span>
                <p>{record.text}</p>
                <footer>
                  <span>
                    <cite>{record.author}</cite>
                    <small>{record.role}</small>
                  </span>
                  <span className="homeTestimonialSources">
                    {record.sources.map((source) => (
                      <a href={source.url} target="_blank" rel="noreferrer" key={source.label} tabIndex={isActive ? 0 : -1}>
                        {source.label} <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </span>
                </footer>
              </blockquote>
            </article>
          );
        })}
      </div>

      {records.length > 1 && <div className="homeTestimonialsControls" aria-label="Choose a guest review">
        <button type="button" onClick={() => showCard((activeIndex - 1 + records.length) % records.length)} aria-label="Previous review">←</button>
        <div>{records.map((record, index) => <button type="button" key={`${record.author}-control`} className={index === activeIndex ? "isActive" : ""} onClick={() => showCard(index)} aria-label={`Show review ${index + 1} of ${records.length}`} aria-current={index === activeIndex ? "true" : undefined}><span /></button>)}</div>
        <button type="button" onClick={() => showCard((activeIndex + 1) % records.length)} aria-label="Next review">→</button>
      </div>}

      <footer className="homeTestimonialsFootnote">
        <span><i aria-hidden="true" /> Active leaf</span>
        <p>Reviews turn automatically. Use the controls to browse at your pace.</p>
        <time dateTime="2026-07-16">Public ratings checked 16 July 2026</time>
      </footer>
    </section>
  );
}
