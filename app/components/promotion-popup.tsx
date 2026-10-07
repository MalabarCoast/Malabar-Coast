"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent} from "react";
import type {Promotion} from "@/sanity/lib/promotions";
import {getCmsImageUrl} from "@/sanity/lib/image";
import {CmsSanityImage} from "./cms-sanity-image";

const POPUP_DELAY_MS = 450;
const DEFAULT_SLIDE_DURATION_SECONDS = 7;
const MIN_SLIDE_DURATION_SECONDS = 4;
const MAX_SLIDE_DURATION_SECONDS = 15;
const SWIPE_THRESHOLD_PX = 48;
const POPUP_IMAGE_WIDTH = 960;

type PromotionPoster = Promotion["poster"];

function firstUsablePoster(...posters: Array<PromotionPoster | undefined>) {
  return posters.find((poster) => Boolean(poster?.url)) as PromotionPoster;
}

function popupPosters(promotion: Promotion) {
  const desktop = firstUsablePoster(promotion.popupDesktopPoster, promotion.poster);
  const mobile = firstUsablePoster(promotion.popupMobilePoster, promotion.popupDesktopPoster, promotion.poster);
  return {desktop, mobile};
}

export function PromotionPopup({promotions, ready}: {promotions: Promotion[]; ready: boolean}) {
  const popupPromotions = useMemo(() => promotions.filter((promotion) => promotion.showOnHomepage !== false), [promotions]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const suppressInitialFocusPause = useRef(true);
  const storageKey = useMemo(() => `malabar-offers-seen:${popupPromotions.map((promotion) => `${promotion._id}:${promotion._updatedAt}`).join(",")}`, [popupPromotions]);
  const activePromotion = popupPromotions[Math.min(activeIndex, Math.max(0, popupPromotions.length - 1))];
  const activeDurationSeconds = Math.min(
    MAX_SLIDE_DURATION_SECONDS,
    Math.max(MIN_SLIDE_DURATION_SECONDS, activePromotion?.displayDurationSeconds || DEFAULT_SLIDE_DURATION_SECONDS),
  );
  const activeDurationMs = activeDurationSeconds * 1000;

  const preloadPoster = useCallback((poster: PromotionPoster | undefined) => {
    if (!poster?.url) return;
    const preload = new window.Image();
    preload.src = getCmsImageUrl(poster, POPUP_IMAGE_WIDTH);
  }, []);

  useEffect(() => {
    if (!ready || popupPromotions.length === 0 || window.sessionStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOpen(true), POPUP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [popupPromotions.length, ready, storageKey]);

  useEffect(() => {
    if (!open) return;
    for (const promotion of popupPromotions) {
      const {desktop, mobile} = popupPosters(promotion);
      preloadPoster(desktop);
      if (mobile.url !== desktop.url) preloadPoster(mobile);
    }
  }, [open, popupPromotions, preloadPoster]);

  useEffect(() => {
    if (!open || paused || popupPromotions.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setActiveIndex((current) => (current + 1) % popupPromotions.length), activeDurationMs);
    return () => window.clearTimeout(timer);
  }, [activeDurationMs, activeIndex, open, paused, popupPromotions.length]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.sessionStorage.setItem(storageKey, "1");
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    suppressInitialFocusPause.current = true;
    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      window.requestAnimationFrame(() => { suppressInitialFocusPause.current = false; });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, storageKey]);

  if (!open || popupPromotions.length === 0) return null;
  const {desktop: desktopPoster, mobile: mobilePoster} = popupPosters(activePromotion);

  const close = () => {
    window.sessionStorage.setItem(storageKey, "1");
    setOpen(false);
  };

  const selectPrevious = () => setActiveIndex((current) => (current - 1 + popupPromotions.length) % popupPromotions.length);
  const selectNext = () => setActiveIndex((current) => (current + 1) % popupPromotions.length);
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setPaused(true);
  };
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    setPaused(false);
    if (start == null || end == null || Math.abs(end - start) < SWIPE_THRESHOLD_PX) return;
    if (end < start) selectNext();
    else selectPrevious();
  };

  return (
    <div className="promotionPopup" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && close()}>
      <div
        ref={dialogRef}
        className="promotionPopupDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-popup-title"
        aria-roledescription="offer carousel"
        data-paused={paused ? "true" : "false"}
        style={{"--promotion-duration": `${activeDurationMs}ms`} as CSSProperties}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => !suppressInitialFocusPause.current && setPaused(true)}
        onBlurCapture={(event) => !event.currentTarget.contains(event.relatedTarget) && setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button ref={closeButtonRef} className="promotionPopupClose" type="button" onClick={close} aria-label="Close offers popup">×</button>
        <div className="promotionPopupSlide" key={activePromotion._id} role="group" aria-label={`Offer ${activeIndex + 1} of ${popupPromotions.length}`} aria-live="polite" aria-atomic="true">
          <div className="promotionPopupPoster promotionPopupPosterDesktop">
            <CmsSanityImage
              image={desktopPoster}
              width={POPUP_IMAGE_WIDTH}
              alt={desktopPoster.alt}
              sizes="(max-width: 760px) 94vw, 430px"
              eager
            />
          </div>
          <div className="promotionPopupPoster promotionPopupPosterMobile">
            <CmsSanityImage
              image={mobilePoster}
              width={POPUP_IMAGE_WIDTH}
              alt={mobilePoster.alt}
              sizes="94vw"
              eager
            />
          </div>
          <div className="promotionPopupCopy">
            <p>{activePromotion.badge || "Current offer"}</p>
            <h2 id="promotion-popup-title">{activePromotion.title}</h2>
            {activePromotion.summary && <span>{activePromotion.summary}</span>}
            {activePromotion.validityLabel && <small>{activePromotion.validityLabel}</small>}
            <div className="promotionPopupActions">
              <Link
                className="promotionPopupPrimary"
                href={activePromotion.callToAction?.href || "/book-a-table"}
                target={activePromotion.callToAction?.openInNewTab ? "_blank" : undefined}
                rel={activePromotion.callToAction?.openInNewTab ? "noreferrer" : undefined}
                onClick={close}
              >
                {activePromotion.callToAction?.label || "Book a table"} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        {popupPromotions.length > 1 && <div className="promotionPopupNav" aria-label="Choose an offer">
          <button type="button" onClick={selectPrevious} aria-label="Previous offer">←</button>
          <div className="promotionPopupProgress">
            <div className="promotionPopupCount"><span>{String(activeIndex + 1).padStart(2, "0")}</span><span>{String(popupPromotions.length).padStart(2, "0")}</span></div>
            <div className="promotionPopupTimer" key={`${activePromotion._id}-${activeIndex}`} aria-hidden="true"><i /></div>
            <div className="promotionPopupDots">{popupPromotions.map((promotion, index) => <button type="button" key={promotion._id} className={index === activeIndex ? "isActive" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show offer ${index + 1}: ${promotion.title}`} aria-current={index === activeIndex ? "true" : undefined}><i /></button>)}</div>
          </div>
          <button className="promotionPopupSkip" type="button" onClick={selectNext} aria-label="Skip to next offer">Skip <span aria-hidden="true">→</span></button>
        </div>}
      </div>
    </div>
  );
}
