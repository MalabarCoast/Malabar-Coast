"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatPrice } from "../lib/menu";
import type { FulfilmentMethod } from "../lib/orders";
import { isWithinSchedule, regularClosureNotice, scheduleNotice, type RestaurantSchedule } from "../lib/restaurant-schedule";
import {
  checkoutAttemptForPayload,
  clearCheckoutAttempt,
  isSafeStripeCheckoutUrl,
  readCheckoutAttempt,
  saveCheckoutAttempt,
  type CheckoutAttempt,
} from "../lib/checkout-recovery";
import { useCart } from "./cart-provider";
import { SmartDateInput } from "./smart-date-input";
import {serviceAvailabilityRefreshMs, serviceUnavailableMessage, type PublicServiceAvailability} from "../lib/service-availability";

type PaymentConfig = { stripe: boolean; deliveryFeePence: number };
type AppliedDiscount = { code: string; percentOff: number };

function recoveryIsForClosedDate(attempt: CheckoutAttempt | null, schedule: RestaurantSchedule) {
  if (!attempt) return false;
  try {
    const payload = JSON.parse(attempt.payload) as {requestedTime?: unknown};
    return typeof payload.requestedTime === "string" && !isWithinSchedule(schedule, payload.requestedTime.slice(0, 10), payload.requestedTime.slice(11));
  } catch {
    return false;
  }
}

export function CheckoutForm({schedule, availability: initialAvailability}: {schedule: RestaurantSchedule; availability: PublicServiceAvailability}) {
  const { lines, items, subtotalPence, setQuantity, removeItem, clearCart, hydrated } = useCart();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>(() => initialAvailability.collection.enabled ? "collection" : initialAvailability.delivery.enabled ? "delivery" : "collection");
  const [channelAvailability, setChannelAvailability] = useState(initialAvailability);
  const [requestedTime, setRequestedTime] = useState("");
  const [liveSchedule, setLiveSchedule] = useState(schedule);
  const closedDate = Boolean(requestedTime) && !isWithinSchedule(liveSchedule, requestedTime.slice(0, 10), requestedTime.slice(11));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [recovery, setRecovery] = useState<CheckoutAttempt | null>(null);
  const closedRecovery = recoveryIsForClosedDate(recovery, liveSchedule);

  useEffect(() => {
    const storedAttempt = readCheckoutAttempt();
    const recoveryFrame = storedAttempt?.orderId && storedAttempt.redirectUrl
      ? window.requestAnimationFrame(() => setRecovery(storedAttempt))
      : undefined;

    let active = true;
    fetch("/api/payment-config")
      .then((response) => response.json())
      .then((value: PaymentConfig) => {
        if (active) setConfig(value);
      })
      .catch(() => active && setError("Secure payment could not be prepared. Please refresh and try again."));
    fetch("/api/schedule", {cache: "no-store"}).then((response) => response.ok ? response.json() : null).then((data) => {if (active && data?.schedule) setLiveSchedule(data.schedule);}).catch(() => undefined);
    const refreshAvailability = () => fetch("/api/availability", {cache: "no-store"}).then((response) => response.ok ? response.json() : null).then((data) => {
      if (!active || !data?.channels) return;
      setChannelAvailability(data.channels);
      setFulfilment((current) => data.channels[current]?.enabled ? current : data.channels.collection?.enabled ? "collection" : data.channels.delivery?.enabled ? "delivery" : current);
    }).catch(() => undefined);
    void refreshAvailability();
    const availabilityTimer = window.setInterval(refreshAvailability, serviceAvailabilityRefreshMs);
    return () => {
      active = false;
      window.clearInterval(availabilityTimer);
      if (recoveryFrame !== undefined) window.cancelAnimationFrame(recoveryFrame);
    };
  }, []);

  const deliveryFee = fulfilment === "delivery" ? config?.deliveryFeePence ?? 350 : 0;
  const originalTotalPence = subtotalPence + deliveryFee;
  const discountPence = appliedDiscount ? Math.min(subtotalPence, Math.round(subtotalPence * appliedDiscount.percentOff / 100)) : 0;
  const totalPence = originalTotalPence - discountPence;
  const paymentReady = config?.stripe === true;
  const fulfilmentReady = channelAvailability[fulfilment].enabled;
  const paymentButtonLabel = submitting
    ? "Opening secure payment…"
    : config === null
      ? "Checking secure payment…"
      : !fulfilmentReady
        ? `${fulfilment === "collection" ? "Collection" : "Delivery"} temporarily unavailable`
      : paymentReady
        ? `Continue to payment · ${formatPrice(totalPence)}`
        : "Payment temporarily unavailable";

  async function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,32}$/.test(code)) {
      setAppliedDiscount(null);
      setDiscountMessage("Enter 3–32 letters and numbers.");
      return;
    }
    setCheckingDiscount(true);
    setDiscountMessage("");
    try {
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({code}),
      });
      const result = await response.json() as {code?: string; percentOff?: number; error?: string};
      if (!response.ok || !result.code || !Number.isInteger(result.percentOff)) {
        throw new Error(result.error || "That code could not be applied.");
      }
      setDiscountCode(result.code);
      setAppliedDiscount({code: result.code, percentOff: result.percentOff!});
      setDiscountMessage(`${result.percentOff}% discount applied to your food.`);
    } catch (caught) {
      setAppliedDiscount(null);
      setDiscountMessage(caught instanceof Error ? caught.message : "That code could not be applied.");
    } finally {
      setCheckingDiscount(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (closedDate) {
      setError(`${scheduleNotice(liveSchedule, requestedTime.slice(0, 10))} Please choose another date or time.`);
      return;
    }
    if (!fulfilmentReady) {
      setError(serviceUnavailableMessage(channelAvailability[fulfilment]));
      return;
    }
    if (!paymentReady) {
      setError("Online payment is temporarily unavailable. Please try again shortly or contact the restaurant.");
      return;
    }

    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const requestPayload = JSON.stringify({
      provider: "stripe",
      fulfilment,
      discountCode: appliedDiscount?.code,
      discountPercent: appliedDiscount?.percentOff,
      cart: items,
      customer: { name: data.get("name"), email: data.get("email"), phone: data.get("phone") },
      requestedTime: data.get("requestedTime"),
      orderNote: data.get("orderNote"),
      deliveryAddress: {
        line1: data.get("line1"),
        line2: data.get("line2"),
        city: data.get("city"),
        postcode: data.get("postcode"),
      },
    });
    const attempt = checkoutAttemptForPayload(requestPayload, readCheckoutAttempt() || recovery);
    saveCheckoutAttempt(attempt);
    setRecovery(attempt);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key },
        body: requestPayload,
        signal: controller.signal,
      });
      const result = await response.json() as { error?: string; orderId?: string; redirectUrl?: string };
      if (!response.ok) {
        if (response.status === 409) {
          clearCheckoutAttempt();
          setRecovery(null);
        }
        throw new Error(result.error || "Payment could not be started.");
      }
      if (!result.orderId || !result.redirectUrl || !isSafeStripeCheckoutUrl(result.redirectUrl)) {
        throw new Error("The payment provider did not return a safe checkout destination.");
      }

      const preparedAttempt = { ...attempt, orderId: result.orderId, redirectUrl: result.redirectUrl };
      saveCheckoutAttempt(preparedAttempt);
      setRecovery(preparedAttempt);
      window.location.assign(result.redirectUrl);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        setError("The connection timed out. Your payment may already be prepared, so retrying will safely resume the same checkout.");
      } else if (caught instanceof TypeError) {
        setError("The connection was interrupted. Check your internet and retry; the same checkout will be resumed safely.");
      } else {
        setError(caught instanceof Error ? caught.message : "Checkout could not be started.");
      }
      setSubmitting(false);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (!hydrated) {
    return <main className="checkoutPage"><div className="checkoutLoading">Preparing your order…</div></main>;
  }

  if (lines.length === 0) {
    return (
      <main className="checkoutPage checkoutEmptyPage">
        <div>
          <p>Your order · 00</p>
          <h1>The table is<br />still empty.</h1>
          <span>Add a few dishes before continuing to checkout.</span>
          <Link href="/menu">Explore the menu <b>→</b></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkoutPage">
      <header className="checkoutIntro">
        <div>
          <p>Online order · Secure checkout</p>
          <h1>Finish your order.</h1>
        </div>
        <p>Share your details, choose collection or delivery, then review everything once before paying securely.</p>
      </header>

      {recovery?.orderId && recovery.redirectUrl && !closedRecovery && (
        <section className="checkoutRecovery" aria-labelledby="checkout-recovery-heading">
          <div>
            <span>Payment recovery</span>
            <h2 id="checkout-recovery-heading">A secure checkout is already waiting.</h2>
            <p>If the connection dropped or the payment window was closed, resume the same checkout. This avoids creating a duplicate order.</p>
          </div>
          <nav aria-label="Payment recovery actions">
            <a href={recovery.redirectUrl}>Resume secure payment <b>→</b></a>
            <Link href={`/order/${recovery.orderId}`}>Check payment status <b>→</b></Link>
            <button type="button" onClick={() => { clearCheckoutAttempt(); setRecovery(null); }}>Start a new payment</button>
          </nav>
        </section>
      )}
      {closedRecovery && <section className="checkoutRecovery" aria-label="Previous checkout for unavailable date">
        <div><span>Choose another time</span><h2>The earlier payment link is for an unavailable time.</h2><p>Choose another date or time to create a new checkout.</p></div>
        <nav><button type="button" onClick={() => {clearCheckoutAttempt(); setRecovery(null);}}>Clear earlier checkout</button></nav>
      </section>}

      <form className="checkoutLayout" onSubmit={handleSubmit}>
        <div className="checkoutDetails">
          <section className="checkoutSection" aria-labelledby="checkout-details-heading">
            <div className="checkoutSectionHeading">
              <span>01</span>
              <div><p>Your details</p><h2 id="checkout-details-heading">Who is the order for?</h2></div>
            </div>
            <div className="fieldGrid">
              <label>Full name<input name="name" autoComplete="name" required /></label>
              <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
              <label>Phone number<input name="phone" type="tel" autoComplete="tel" required /></label>
            </div>
          </section>

          <section className="checkoutSection" aria-labelledby="checkout-fulfilment-heading">
            <div className="checkoutSectionHeading">
              <span>02</span>
              <div><p>Fulfilment</p><h2 id="checkout-fulfilment-heading">How would you like it?</h2></div>
            </div>
            <div className="choiceCards">
              <label className={`${fulfilment === "collection" ? "isSelected" : ""}${!channelAvailability.collection.enabled ? " isUnavailable" : ""}`}>
                <input type="radio" name="fulfilment" value="collection" checked={fulfilment === "collection"} disabled={!channelAvailability.collection.enabled} onChange={() => setFulfilment("collection")} />
                <strong>Collection</strong><span>Collect from 33 Main Street, Holytown</span>
              </label>
              <label className={`${fulfilment === "delivery" ? "isSelected" : ""}${!channelAvailability.delivery.enabled ? " isUnavailable" : ""}`}>
                <input type="radio" name="fulfilment" value="delivery" checked={fulfilment === "delivery"} disabled={!channelAvailability.delivery.enabled} onChange={() => setFulfilment("delivery")} />
                <strong>Delivery</strong><span>{formatPrice(config?.deliveryFeePence ?? 350)} delivery fee</span>
              </label>
            </div>
            {!channelAvailability.collection.enabled && <p className="paymentNotice" role="status"><strong>Collection paused.</strong> {serviceUnavailableMessage(channelAvailability.collection)}</p>}
            {!channelAvailability.delivery.enabled && <p className="paymentNotice" role="status"><strong>Delivery paused.</strong> {serviceUnavailableMessage(channelAvailability.delivery)}</p>}
            <label className="fullField">Requested date &amp; time<SmartDateInput name="requestedTime" type="datetime-local" onChange={(event) => setRequestedTime(event.target.value)} required /></label>
            <p className="checkoutScheduleNote">{regularClosureNotice} Holiday hours may differ.</p>
            {closedDate && <p className="paymentNotice" role="alert">{scheduleNotice(liveSchedule, requestedTime.slice(0, 10))} Choose another date or time before continuing to payment.</p>}
            {fulfilment === "delivery" && (
              <div className="fieldGrid addressFields">
                <label>Address line 1<input name="line1" autoComplete="address-line1" required /></label>
                <label>Address line 2<input name="line2" autoComplete="address-line2" /></label>
                <label>Town or city<input name="city" autoComplete="address-level2" required /></label>
                <label>Postcode<input name="postcode" autoComplete="postal-code" required /></label>
              </div>
            )}
            <label className="fullField">Order note<textarea name="orderNote" maxLength={500} placeholder="Allergies, collection details, or anything the team should know" /></label>
          </section>

          <section className="checkoutSection checkoutPaymentSection" aria-labelledby="checkout-payment-heading">
            <div className="checkoutSectionHeading">
              <span>03</span>
              <div><p>Payment</p><h2 id="checkout-payment-heading">Review, then pay.</h2></div>
            </div>
            {config && !config.stripe && (
              <div className="paymentNotice" role="status">
                Online payment is temporarily unavailable. Please try again shortly or contact the restaurant for help.
              </div>
            )}
            <div className="paymentHandoff">
              <div className="paymentHandoffLead">
                <span className="paymentSecureMark" aria-hidden="true">✓</span>
                <div>
                  <strong>Secure card payment</strong>
                  <p>After your final review, Stripe opens securely to complete your card payment.</p>
                </div>
                <span className={`paymentReadiness ${paymentReady ? "isReady" : ""}`}>
                  {config === null ? "Checking" : paymentReady ? "Ready" : "Unavailable"}
                </span>
              </div>
              <div className="discountEntry">
                <label htmlFor="discountCode">Discount code</label>
                <div>
                  <input
                    id="discountCode"
                    value={discountCode}
                    inputMode="text"
                    autoComplete="off"
                    maxLength={32}
                    placeholder="Enter code"
                    onChange={(event) => {
                      const code = event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                      setDiscountCode(code);
                      if (appliedDiscount && code !== appliedDiscount.code) {
                        setAppliedDiscount(null);
                        setDiscountMessage("");
                      }
                    }}
                  />
                  <button type="button" onClick={applyDiscount} disabled={checkingDiscount || !discountCode}>
                    {checkingDiscount ? "Checking…" : appliedDiscount ? "Reapply" : "Apply"}
                  </button>
                </div>
                {discountMessage && <p className={appliedDiscount ? "isApplied" : "isInvalid"} role="status">{discountMessage}</p>}
                <small>Codes use letters and numbers only. One code can be applied per order.</small>
              </div>
              <ul className="paymentPromises" aria-label="Secure payment details">
                <li><span>01</span><div><strong>Details stay private</strong><p>Your card information is handled by Stripe, not stored by us.</p></div></li>
                <li><span>02</span><div><strong>Nothing changes unexpectedly</strong><p>The final amount is shown beside the payment button before you continue.</p></div></li>
                <li><span>03</span><div><strong>Confirmation follows</strong><p>Once payment is confirmed, we email your order summary and reference.</p></div></li>
              </ul>
            </div>
          </section>
        </div>

        <aside className="checkoutSummary" aria-label="Order summary">
          <div className="summaryHeading">
            <div><span>Your order</span><strong>{lines.length} {lines.length === 1 ? "line" : "lines"}</strong></div>
            <Link href="/menu">Add dishes</Link>
          </div>
          <div className="summaryLines">
            {lines.map((line) => (
              <article key={line.id}>
                <div>
                  <strong>{line.menuItem.name}</strong>
                  <span>{line.menuItem.description}</span>
                  {line.note && <small>Note: {line.note}</small>}
                </div>
                <b>{formatPrice(line.lineTotalPence)}</b>
                <div className="quantityControl">
                  <button type="button" aria-label={`Decrease ${line.menuItem.name} quantity`} onClick={() => setQuantity(line.id, line.quantity - 1)}>−</button>
                  <span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span>
                  <button type="button" aria-label={`Increase ${line.menuItem.name} quantity`} onClick={() => setQuantity(line.id, line.quantity + 1)}>+</button>
                  <button type="button" className="removeLine" onClick={() => removeItem(line.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
          <div className="summaryTotals">
            <p><span>Subtotal</span><b>{formatPrice(subtotalPence)}</b></p>
            <p><span>Delivery</span><b>{deliveryFee ? formatPrice(deliveryFee) : "Included"}</b></p>
            {appliedDiscount && <p className="summaryDiscount"><span>{appliedDiscount.code} · {appliedDiscount.percentOff}% off food</span><b>−{formatPrice(discountPence)}</b></p>}
            <strong className={appliedDiscount ? "hasDiscount" : undefined}>
              <span>Total to pay</span>
              <b>{appliedDiscount && <del>{formatPrice(originalTotalPence)}</del>}{formatPrice(totalPence)}</b>
            </strong>
          </div>
          {error && <div className="checkoutError" role="alert" aria-live="assertive">{error}</div>}
          <button className="payButton" type="submit" disabled={submitting || !paymentReady || !fulfilmentReady || closedDate} aria-busy={submitting}>
            <span>{paymentButtonLabel}</span><b aria-hidden="true">→</b>
          </button>
          <button className="clearOrder" type="button" onClick={clearCart}>Clear order</button>
          <small>Totals and item availability are checked again securely before payment begins.</small>
        </aside>
      </form>
    </main>
  );
}
