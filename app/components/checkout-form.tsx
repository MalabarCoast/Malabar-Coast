"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { formatPrice } from "../lib/menu";
import type { FulfilmentMethod } from "../lib/orders";
import { isRegularClosureDate, regularClosureNotice } from "../lib/restaurant-schedule";
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

type PaymentConfig = { stripe: boolean; deliveryFeePence: number };

function recoveryIsForClosedDate(attempt: CheckoutAttempt | null) {
  if (!attempt) return false;
  try {
    const payload = JSON.parse(attempt.payload) as {requestedTime?: unknown};
    return typeof payload.requestedTime === "string" && isRegularClosureDate(payload.requestedTime.slice(0, 10));
  } catch {
    return false;
  }
}

export function CheckoutForm() {
  const { lines, items, subtotalPence, setQuantity, removeItem, clearCart, hydrated } = useCart();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>("collection");
  const [requestedTime, setRequestedTime] = useState("");
  const closedDate = isRegularClosureDate(requestedTime.slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState<CheckoutAttempt | null>(null);
  const closedRecovery = recoveryIsForClosedDate(recovery);

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
    return () => {
      active = false;
      if (recoveryFrame !== undefined) window.cancelAnimationFrame(recoveryFrame);
    };
  }, []);

  const deliveryFee = fulfilment === "delivery" ? config?.deliveryFeePence ?? 350 : 0;
  const totalPence = subtotalPence + deliveryFee;
  const paymentReady = config?.stripe === true;
  const paymentButtonLabel = submitting
    ? "Opening secure payment…"
    : config === null
      ? "Checking secure payment…"
      : paymentReady
        ? `Continue to payment · ${formatPrice(totalPence)}`
        : "Payment temporarily unavailable";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (closedDate) {
      setError("Online collection and delivery are unavailable on Mondays. Please choose another day.");
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
      {closedRecovery && <section className="checkoutRecovery" aria-label="Previous Monday checkout">
        <div><span>Choose another day</span><h2>The earlier payment link is for a Monday.</h2><p>Online collection and delivery are unavailable on Mondays. Select another date to create a new checkout.</p></div>
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
              <label className={fulfilment === "collection" ? "isSelected" : ""}>
                <input type="radio" name="fulfilment" value="collection" checked={fulfilment === "collection"} onChange={() => setFulfilment("collection")} />
                <strong>Collection</strong><span>Collect from 33 Main Street, Holytown</span>
              </label>
              <label className={fulfilment === "delivery" ? "isSelected" : ""}>
                <input type="radio" name="fulfilment" value="delivery" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} />
                <strong>Delivery</strong><span>{formatPrice(config?.deliveryFeePence ?? 350)} delivery fee</span>
              </label>
            </div>
            <label className="fullField">Requested date &amp; time<SmartDateInput name="requestedTime" type="datetime-local" onChange={(event) => setRequestedTime(event.target.value)} required /></label>
            <p className="checkoutScheduleNote">{regularClosureNotice} Please choose Tuesday to Sunday for collection or delivery.</p>
            {closedDate && <p className="paymentNotice" role="alert">Online orders are unavailable on Mondays. Choose another date before continuing to payment.</p>}
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
            <strong><span>Total to pay</span><b>{formatPrice(totalPence)}</b></strong>
          </div>
          {error && <div className="checkoutError" role="alert" aria-live="assertive">{error}</div>}
          <button className="payButton" type="submit" disabled={submitting || !paymentReady || closedDate} aria-busy={submitting}>
            <span>{paymentButtonLabel}</span><b aria-hidden="true">→</b>
          </button>
          <button className="clearOrder" type="button" onClick={clearCart}>Clear order</button>
          <small>Totals and item availability are checked again securely before payment begins.</small>
        </aside>
      </form>
    </main>
  );
}
