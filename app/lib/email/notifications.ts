import type { HallEnquiry, TableReservation } from "../bookings";
import type { OrderRecord, PaymentStatus } from "../orders";
import { ownerEmail, sendBrevoEmail } from "./brevo";

type EmailCta = { label: string; href: string };
type Detail = { label: string; value: unknown };

const restaurantAddress = "33 Main Street, Holytown, North Lanarkshire, ML1 4TH";

function esc(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

function emailValue(value: unknown) {
  return esc(value).replace(/\r?\n/g, "<br>");
}

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

function shortReference(value: string) {
  return value.slice(-8).toUpperCase();
}

function siteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://malabarcoast.co.uk");
    return url.origin;
  } catch {
    return "https://malabarcoast.co.uk";
  }
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatRequestedTime(value: string) {
  const [date, time] = value.split("T");
  return date && time ? `${formatDate(date)} at ${time}` : value;
}

function detailTable(details: Detail[]) {
  const cells = details.map((detail) => `
    <td class="detail-cell" style="width:50%;padding:14px 16px;border:1px solid #d7cbb7;vertical-align:top">
      <span style="display:block;margin-bottom:5px;color:#8a5d24;font-size:10px;letter-spacing:1.5px;text-transform:uppercase">${esc(detail.label)}</span>
      <strong style="display:block;color:#10201c;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:400;line-height:1.4">${emailValue(detail.value)}</strong>
    </td>`);
  const rows: string[] = [];
  for (let index = 0; index < cells.length; index += 2) {
    rows.push(`<tr>${cells[index]}${cells[index + 1] ?? '<td class="detail-cell" style="width:50%;padding:14px 16px;border:1px solid #d7cbb7">&nbsp;</td>'}</tr>`);
  }
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border-collapse:collapse;table-layout:fixed">${rows.join("")}</table>`;
}

function noteBlock(title: string, copy: string, tone: "default" | "action" = "default") {
  const background = tone === "action" ? "#10201c" : "#eadfc9";
  const titleColor = tone === "action" ? "#d5aa63" : "#8a5d24";
  const copyColor = tone === "action" ? "#f4efe4" : "#10201c";
  return `<div style="margin:24px 0;padding:18px 20px;background:${background};color:${copyColor}">
    <p style="margin:0 0 7px;color:${titleColor};font-size:10px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase">${esc(title)}</p>
    <p style="margin:0;color:${copyColor};font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55">${esc(copy)}</p>
  </div>`;
}

function emailFrame(input: {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  body: string;
  cta?: EmailCta;
  footerNote?: string;
}) {
  const cta = input.cta ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 4px"><tr><td style="background:#10201c"><a href="${esc(input.cta.href)}" style="display:inline-block;padding:15px 22px;color:#f4efe4;font-size:11px;font-weight:700;letter-spacing:1.4px;text-decoration:none;text-transform:uppercase">${esc(input.cta.label)} &nbsp;→</a></td></tr></table>` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(input.title)}</title>
  <style>
    @media only screen and (max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:20px!important;padding-right:20px!important}.detail-cell{display:block!important;width:auto!important}.email-title{font-size:36px!important}.item-note{padding-left:0!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:#ddd1ba;color:#10201c;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(input.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ddd1ba">
    <tr><td align="center" style="padding:24px 12px">
      <table class="email-shell" role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:640px;background:#f4efe4;border:1px solid #c9baa2">
        <tr><td style="height:5px;background:#c79b55;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr><td class="email-pad" style="padding:26px 36px;background:#071310;color:#f4efe4">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.1">Malabar Coast</td>
            <td align="right" style="color:#c79b55;font-size:9px;letter-spacing:1.8px;text-transform:uppercase">Holytown · Scotland</td>
          </tr></table>
        </td></tr>
        <tr><td class="email-pad" style="padding:38px 36px 32px">
          <p style="margin:0 0 11px;color:#8a5d24;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${esc(input.eyebrow)}</p>
          <h1 class="email-title" style="margin:0;color:#10201c;font-family:Georgia,'Times New Roman',serif;font-size:44px;font-weight:400;line-height:1.03;letter-spacing:-1.2px">${esc(input.title)}</h1>
          <p style="max-width:520px;margin:18px 0 0;color:#42504c;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6">${esc(input.intro)}</p>
          ${input.body}
          ${cta}
        </td></tr>
        <tr><td class="email-pad" style="padding:24px 36px;border-top:1px solid #d7cbb7;background:#eadfc9">
          <p style="margin:0;color:#10201c;font-family:Georgia,'Times New Roman',serif;font-size:15px">${esc(input.footerNote || "We look forward to welcoming you.")}</p>
          <p style="margin:9px 0 0;color:#65706c;font-size:11px;line-height:1.55">${esc(restaurantAddress)}<br>This is an automated service email from Malabar Coast.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function orderItemsTable(order: OrderRecord) {
  const items = order.lines.map((line) => `<tr>
    <td style="padding:14px 0;border-bottom:1px solid #d7cbb7;vertical-align:top;color:#8a5d24;font-size:13px">${esc(line.quantity)} ×</td>
    <td style="padding:14px 12px;border-bottom:1px solid #d7cbb7;vertical-align:top">
      <strong style="display:block;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:400">${esc(line.name)}</strong>
      ${line.note ? `<span class="item-note" style="display:block;margin-top:5px;color:#8a5d24;font-size:11px;line-height:1.45">Note: ${esc(line.note)}</span>` : ""}
    </td>
    <td align="right" style="padding:14px 0;border-bottom:1px solid #d7cbb7;vertical-align:top;font-family:Georgia,'Times New Roman',serif;font-size:15px;white-space:nowrap">${esc(money(line.lineTotalPence))}</td>
  </tr>`).join("");

  return `<div style="margin:28px 0">
    <p style="margin:0 0 8px;color:#8a5d24;font-size:10px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase">Order details</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      ${items}
      <tr><td colspan="2" style="padding:12px 12px 3px 0;color:#65706c;font-size:12px">Subtotal</td><td align="right" style="padding:12px 0 3px;font-size:13px">${esc(money(order.subtotalPence))}</td></tr>
      <tr><td colspan="2" style="padding:5px 12px 12px 0;color:#65706c;font-size:12px">Delivery</td><td align="right" style="padding:5px 0 12px;font-size:13px">${order.deliveryFeePence ? esc(money(order.deliveryFeePence)) : "Included"}</td></tr>
      <tr><td colspan="2" style="padding:14px 12px 0 0;border-top:2px solid #10201c;font-family:Georgia,'Times New Roman',serif;font-size:18px">Total paid</td><td align="right" style="padding:14px 0 0;border-top:2px solid #10201c;font-family:Georgia,'Times New Roman',serif;font-size:20px">${esc(money(order.totalPence))}</td></tr>
    </table>
  </div>`;
}

function optionalOrderDetails(order: OrderRecord) {
  const blocks: string[] = [];
  if (order.deliveryAddress) {
    const address = [order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.postcode].filter(Boolean).join(", ");
    blocks.push(noteBlock("Delivery address", address));
  }
  if (order.orderNote) blocks.push(noteBlock("Order note", order.orderNote));
  return blocks.join("");
}

function plainOrderLines(order: OrderRecord) {
  return order.lines.map((line) => `${line.quantity} × ${line.name}: ${money(line.lineTotalPence)}${line.note ? `\n  Note: ${line.note}` : ""}`).join("\n");
}

export async function notifyPaidOrder(order: OrderRecord) {
  const reference = shortReference(order.id);
  const requested = formatRequestedTime(order.requestedTime);
  const fulfilment = order.fulfilment === "delivery" ? "Delivery" : "Collection";
  const orderDetails = detailTable([
    { label: "Order reference", value: reference },
    { label: "Payment", value: "Paid securely by card" },
    { label: "Fulfilment", value: fulfilment },
    { label: "Requested for", value: requested },
  ]);
  const ownerDetails = detailTable([
    { label: "Customer", value: order.customer.name },
    { label: "Phone", value: order.customer.phone },
    { label: "Email", value: order.customer.email },
    { label: "Reference", value: reference },
    { label: "Fulfilment", value: fulfilment },
    { label: "Requested for", value: requested },
  ]);
  const plainItems = plainOrderLines(order);

  await Promise.allSettled([
    sendBrevoEmail({
      eventKey: `order:${order.id}:paid:customer`,
      category: "paid_order_customer",
      to: { email: order.customer.email, name: order.customer.name },
      subject: `Order confirmed · ${reference} · ${money(order.totalPence)}`,
      html: emailFrame({
        preheader: `Payment confirmed for order ${reference}. ${fulfilment} requested for ${requested}.`,
        eyebrow: "Payment confirmed",
        title: "Your order is with us.",
        intro: `Thank you, ${order.customer.name}. Your payment has been received and the Malabar Coast team now has your order.`,
        body: orderDetails + orderItemsTable(order) + optionalOrderDetails(order) + noteBlock("What happens next", order.fulfilment === "delivery" ? "We will confirm the order and prepare it for delivery at your requested time. Keep this email for your reference." : "We will confirm the order and prepare it for collection at your requested time. Keep this email for your reference."),
        cta: { label: "Explore the menu", href: `${siteOrigin()}/menu` },
        footerNote: "Thank you for ordering from Malabar Coast.",
      }),
      text: `MALABAR COAST\n\nPAYMENT CONFIRMED\nYour order is with us.\n\nHello ${order.customer.name},\nYour payment has been received and the restaurant now has your order.\n\nOrder reference: ${reference}\nPayment: Paid securely by card\nFulfilment: ${fulfilment}\nRequested for: ${requested}\n\nORDER DETAILS\n${plainItems}\n\nSubtotal: ${money(order.subtotalPence)}\nDelivery: ${order.deliveryFeePence ? money(order.deliveryFeePence) : "Included"}\nTotal paid: ${money(order.totalPence)}${order.deliveryAddress ? `\n\nDelivery address: ${[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.postcode].filter(Boolean).join(", ")}` : ""}${order.orderNote ? `\n\nOrder note: ${order.orderNote}` : ""}\n\nWe will confirm and prepare your order for the requested time.\n\n${restaurantAddress}`,
    }),
    sendBrevoEmail({
      eventKey: `order:${order.id}:paid:owner`,
      category: "paid_order_owner",
      to: { email: ownerEmail(), name: "Malabar Coast team" },
      subject: `Paid order · ${fulfilment} · ${requested} · ${order.customer.name}`,
      html: emailFrame({
        preheader: `Action needed: paid ${fulfilment.toLowerCase()} order ${reference} for ${requested}.`,
        eyebrow: "New paid order · Action needed",
        title: "A paid order has arrived.",
        intro: `${order.customer.name} has paid ${money(order.totalPence)} for ${fulfilment.toLowerCase()}. Review the requested time and move the order into the kitchen workflow.`,
        body: noteBlock("Team action", "Open the order, confirm the requested fulfilment time, then advance it through the kitchen workflow.", "action") + ownerDetails + orderItemsTable(order) + optionalOrderDetails(order),
        cta: { label: "Open this order", href: `${siteOrigin()}/admin/orders/${encodeURIComponent(order.id)}` },
        footerNote: "This payment is recorded; fulfilment still requires staff confirmation.",
      }),
      text: `MALABAR COAST · NEW PAID ORDER\n\nACTION NEEDED\nOpen the order, confirm the requested fulfilment time, then advance it through the kitchen workflow.\n\nReference: ${reference}\nCustomer: ${order.customer.name}\nPhone: ${order.customer.phone}\nEmail: ${order.customer.email}\nFulfilment: ${fulfilment}\nRequested for: ${requested}\nTotal paid: ${money(order.totalPence)}\n\nORDER DETAILS\n${plainItems}${order.deliveryAddress ? `\n\nDelivery address: ${[order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.city, order.deliveryAddress.postcode].filter(Boolean).join(", ")}` : ""}${order.orderNote ? `\n\nOrder note: ${order.orderNote}` : ""}\n\nAdmin: ${siteOrigin()}/admin/orders/${order.id}`,
    }),
  ]);
}

export async function notifyPaymentUpdate(order: OrderRecord, input: {
  eventId: string;
  eventType: string;
  paymentStatus: Extract<PaymentStatus, "partially_refunded" | "refunded" | "disputed" | "reversed">;
  amountPence?: number;
}) {
  const reference = shortReference(order.id);
  const refunded = input.paymentStatus === "partially_refunded" || input.paymentStatus === "refunded";
  const amount = Math.max(0, input.amountPence ?? order.totalPence);
  const fullRefund = input.paymentStatus === "refunded";
  const customerTitle = fullRefund ? "Your refund has been recorded." : "A partial refund has been recorded.";
  const customerIntro = fullRefund
    ? `${order.customer.name}, Stripe has confirmed a refund of ${money(amount)} for order ${reference}.`
    : `${order.customer.name}, Stripe has confirmed that ${money(amount)} has been refunded so far for order ${reference}.`;
  const statusLabel = input.paymentStatus.replaceAll("_", " ");
  const ownerAction = refunded
    ? "Review the provider record and the order history. Confirm the refund amount and contact the customer if any further action is required."
    : "Do not fulfil or manually reopen this order. Review the dispute in Stripe and retain the order and delivery evidence for follow-up.";

  const messages = [
    sendBrevoEmail({
      eventKey: `order:${order.id}:payment:${input.eventId}:owner`,
      category: "payment_update_owner",
      to: { email: ownerEmail(), name: "Malabar Coast team" },
      subject: `${refunded ? "Refund update" : "Payment dispute"} · ${reference} · ${order.customer.name}`,
      html: emailFrame({
        preheader: `${statusLabel} payment update for order ${reference}.`,
        eyebrow: refunded ? "Refund update · Review" : "Payment issue · Action required",
        title: refunded ? "A refund has been recorded." : "A payment needs review.",
        intro: refunded
          ? `${money(amount)} has been recorded against ${order.customer.name}'s order. The payment state is now ${statusLabel}.`
          : `Stripe reported a ${statusLabel} payment state for ${order.customer.name}'s order. Fulfilment is locked until the issue is reviewed.`,
        body: noteBlock("Team action", ownerAction, "action") + detailTable([
          { label: "Order reference", value: reference },
          { label: "Payment state", value: statusLabel },
          { label: refunded ? "Refund recorded" : "Order total", value: money(refunded ? amount : order.totalPence) },
          { label: "Customer", value: order.customer.name },
        ]),
        cta: { label: "Review this order", href: `${siteOrigin()}/admin/orders/${encodeURIComponent(order.id)}` },
        footerNote: "Provider events establish payment state; staff fulfilment remains a separate decision.",
      }),
      text: `MALABAR COAST · PAYMENT UPDATE\n\nACTION REQUIRED\n${ownerAction}\n\nReference: ${reference}\nCustomer: ${order.customer.name}\nPayment state: ${statusLabel}\n${refunded ? `Refund recorded: ${money(amount)}` : `Order total: ${money(order.totalPence)}`}\nProvider event: ${input.eventType}\n\nAdmin: ${siteOrigin()}/admin/orders/${order.id}`,
    }),
  ];

  if (refunded) {
    messages.push(sendBrevoEmail({
      eventKey: `order:${order.id}:payment:${input.eventId}:customer`,
      category: "refund_update_customer",
      to: { email: order.customer.email, name: order.customer.name },
      subject: `${fullRefund ? "Refund confirmed" : "Partial refund confirmed"} · ${reference} · ${money(amount)}`,
      html: emailFrame({
        preheader: `${money(amount)} ${fullRefund ? "has been refunded" : "has been refunded so far"} for order ${reference}.`,
        eyebrow: fullRefund ? "Refund confirmed" : "Partial refund confirmed",
        title: customerTitle,
        intro: customerIntro,
        body: detailTable([
          { label: "Order reference", value: reference },
          { label: "Refund recorded", value: money(amount) },
          { label: "Original order total", value: money(order.totalPence) },
          { label: "Payment state", value: fullRefund ? "Refunded" : "Partially refunded" },
        ]) + noteBlock("When will it arrive?", "Your bank controls when the refunded amount appears. If it does not appear after the timeframe shown by your bank, contact the restaurant with this order reference."),
        cta: { label: "View order status", href: `${siteOrigin()}/order/${encodeURIComponent(order.id)}` },
        footerNote: "Keep this message as your refund update.",
      }),
      text: `MALABAR COAST · ${fullRefund ? "REFUND CONFIRMED" : "PARTIAL REFUND CONFIRMED"}\n\nHello ${order.customer.name},\n${customerIntro}\n\nOrder reference: ${reference}\nRefund recorded: ${money(amount)}\nOriginal order total: ${money(order.totalPence)}\n\nYour bank controls when the amount appears. Contact the restaurant with this reference if it is not visible after your bank's stated timeframe.\n\n${restaurantAddress}`,
    }));
  }

  await Promise.allSettled(messages);
}

export async function notifyPaymentException(order: OrderRecord, input: {
  eventId: string;
  eventType: "refund.failed" | "charge.dispute.funds_reinstated";
  amountPence?: number;
}) {
  const reference = shortReference(order.id);
  const failedRefund = input.eventType === "refund.failed";
  const amount = Math.max(0, input.amountPence ?? order.totalPence);
  const ownerAction = failedRefund
    ? "The refund did not complete. Review the failure reason in Stripe, correct the issue, and contact the customer before retrying."
    : "Stripe reports that disputed funds were reinstated. Review the case and order history before deciding whether any manual state change is appropriate.";
  const messages = [
    sendBrevoEmail({
      eventKey: `order:${order.id}:exception:${input.eventId}:owner`,
      category: "payment_exception_owner",
      to: { email: ownerEmail(), name: "Malabar Coast team" },
      subject: `${failedRefund ? "Refund failed" : "Disputed funds reinstated"} · ${reference}`,
      html: emailFrame({
        preheader: `${failedRefund ? "Refund failure" : "Dispute update"} for order ${reference}.`,
        eyebrow: "Payment exception · Action required",
        title: failedRefund ? "A refund did not complete." : "Disputed funds were reinstated.",
        intro: ownerAction,
        body: noteBlock("Team action", ownerAction, "action") + detailTable([
          { label: "Order reference", value: reference },
          { label: failedRefund ? "Attempted refund" : "Order total", value: money(amount) },
          { label: "Customer", value: order.customer.name },
          { label: "Provider event", value: input.eventType },
        ]),
        cta: { label: "Review this order", href: `${siteOrigin()}/admin/orders/${encodeURIComponent(order.id)}` },
        footerNote: "Do not change fulfilment until the provider record has been reviewed.",
      }),
      text: `MALABAR COAST · PAYMENT EXCEPTION\n\n${ownerAction}\n\nReference: ${reference}\nCustomer: ${order.customer.name}\nAmount: ${money(amount)}\nProvider event: ${input.eventType}\n\nAdmin: ${siteOrigin()}/admin/orders/${order.id}`,
    }),
  ];

  if (failedRefund) {
    messages.push(sendBrevoEmail({
      eventKey: `order:${order.id}:exception:${input.eventId}:customer`,
      category: "refund_failure_customer",
      to: { email: order.customer.email, name: order.customer.name },
      subject: `Refund update · ${reference}`,
      html: emailFrame({
        preheader: `There is an issue processing the refund for order ${reference}.`,
        eyebrow: "Refund update",
        title: "Your refund needs attention.",
        intro: `${order.customer.name}, the payment provider could not complete the ${money(amount)} refund for order ${reference}. The Malabar Coast team has been alerted.`,
        body: noteBlock("What happens next", "You do not need to place or pay for the order again. Our team will review the provider response and contact you if anything is needed."),
        footerNote: "Please keep this message and your order reference.",
      }),
      text: `MALABAR COAST · REFUND UPDATE\n\nHello ${order.customer.name},\nThe payment provider could not complete the ${money(amount)} refund for order ${reference}. Our team has been alerted.\n\nYou do not need to place or pay for the order again. We will review the issue and contact you if anything is needed.\n\n${restaurantAddress}`,
    }));
  }

  await Promise.allSettled(messages);
}

export async function notifyReservation(reservation: TableReservation) {
  const date = formatDate(reservation.bookingDate);
  const time = `${reservation.startTime}–${reservation.endTime}`;
  const coreDetails = detailTable([
    { label: "Booking reference", value: reservation.reference },
    { label: "Date", value: date },
    { label: "Time", value: time },
    { label: "Guests", value: `${reservation.partySize} ${reservation.partySize === 1 ? "guest" : "guests"}` },
  ]);
  const customerNotes = [
    reservation.occasion && noteBlock("Occasion", reservation.occasion),
    reservation.dietaryRequirements && noteBlock("Dietary requirements", reservation.dietaryRequirements),
    reservation.accessibilityNeeds && noteBlock("Accessibility", reservation.accessibilityNeeds),
  ].filter(Boolean).join("");
  const ownerDetails = detailTable([
    { label: "Customer", value: reservation.name },
    { label: "Phone", value: reservation.phone },
    { label: "Email", value: reservation.email },
    { label: "Reference", value: reservation.reference },
  ]);

  await Promise.allSettled([
    sendBrevoEmail({
      eventKey: `reservation:${reservation.id}:confirmed:customer`,
      category: "reservation_customer",
      to: { email: reservation.email, name: reservation.name },
      subject: `Table confirmed · ${date} at ${reservation.startTime}`,
      html: emailFrame({
        preheader: `Your table for ${reservation.partySize} is confirmed for ${date} at ${reservation.startTime}.`,
        eyebrow: "Table confirmed",
        title: "Your table is ready for you.",
        intro: `Thank you, ${reservation.name}. We have reserved your table and look forward to welcoming you to Malabar Coast.`,
        body: coreDetails + customerNotes + noteBlock("Before you arrive", "If your plans change or you need to update dietary or accessibility details, please contact the restaurant as soon as possible."),
        cta: { label: "View the restaurant", href: `${siteOrigin()}/restaurant` },
        footerNote: "We look forward to welcoming you to the table.",
      }),
      text: `MALABAR COAST\n\nTABLE CONFIRMED\n\nHello ${reservation.name},\nYour table is confirmed.\n\nReference: ${reservation.reference}\nDate: ${date}\nTime: ${time}\nGuests: ${reservation.partySize}${reservation.occasion ? `\nOccasion: ${reservation.occasion}` : ""}${reservation.dietaryRequirements ? `\nDietary requirements: ${reservation.dietaryRequirements}` : ""}${reservation.accessibilityNeeds ? `\nAccessibility: ${reservation.accessibilityNeeds}` : ""}\n\n${restaurantAddress}`,
    }),
    sendBrevoEmail({
      eventKey: `reservation:${reservation.id}:confirmed:owner`,
      category: "reservation_owner",
      to: { email: ownerEmail(), name: "Malabar Coast team" },
      subject: `New table · ${reservation.partySize} guests · ${date} ${reservation.startTime}`,
      html: emailFrame({
        preheader: `New table for ${reservation.partySize}: ${reservation.name}, ${date} at ${reservation.startTime}.`,
        eyebrow: "New table booking · Team copy",
        title: "A table has been booked.",
        intro: `${reservation.name} is joining with ${reservation.partySize} ${reservation.partySize === 1 ? "guest" : "guests"}. Review any dietary, accessibility or occasion notes before service.`,
        body: noteBlock("Team action", "Review the guest notes and make any seating or service preparations before arrival.", "action") + coreDetails + ownerDetails + detailTable([
          { label: "Occasion", value: reservation.occasion || "None provided" },
          { label: "Dietary requirements", value: reservation.dietaryRequirements || "None provided" },
          { label: "Accessibility", value: reservation.accessibilityNeeds || "None provided" },
          { label: "Guest notes", value: reservation.notes || "None provided" },
        ]),
        cta: { label: "Manage reservations", href: `${siteOrigin()}/admin/reservations` },
        footerNote: "This table is confirmed and included in the reservation register.",
      }),
      text: `MALABAR COAST · NEW TABLE\n\nReference: ${reservation.reference}\nCustomer: ${reservation.name}\nPhone: ${reservation.phone}\nEmail: ${reservation.email}\nDate: ${date}\nTime: ${time}\nGuests: ${reservation.partySize}\nOccasion: ${reservation.occasion || "None provided"}\nDietary requirements: ${reservation.dietaryRequirements || "None provided"}\nAccessibility: ${reservation.accessibilityNeeds || "None provided"}\nNotes: ${reservation.notes || "None provided"}\n\nAdmin: ${siteOrigin()}/admin/reservations`,
    }),
  ]);
}

export async function notifyHallEnquiry(enquiry: HallEnquiry) {
  // Hall enquiries are requests until a staff member approves them.
  const preferredDate = formatDate(enquiry.preferredDate);
  const coreDetails = detailTable([
    { label: "Enquiry reference", value: enquiry.reference },
    { label: "Preferred date", value: preferredDate },
    { label: "Preferred time", value: enquiry.preferredTime || "Flexible" },
    { label: "Estimated guests", value: enquiry.guestCount || "Not provided" },
  ]);

  await Promise.allSettled([
    sendBrevoEmail({
      eventKey: `hall:${enquiry.id}:new:customer`,
      category: "hall_customer",
      to: { email: enquiry.email, name: enquiry.name },
      subject: `Hall enquiry received · ${enquiry.reference}`,
      html: emailFrame({
        preheader: `We have received hall enquiry ${enquiry.reference} for ${preferredDate}.`,
        eyebrow: "Enquiry received",
        title: "Let’s make room for your occasion.",
        intro: `Thank you, ${enquiry.name}. Your private hall request is now with our events team for review.`,
        body: noteBlock("Important", "This is an enquiry, not a confirmed booking. Our team will check availability and contact you before anything is reserved.") + coreDetails + (enquiry.occasion ? noteBlock("Occasion", enquiry.occasion) : "") + (enquiry.message ? noteBlock("Your message", enquiry.message) : ""),
        cta: { label: "View the private hall", href: `${siteOrigin()}/hall` },
        footerNote: `We will reply using your preferred contact method: ${enquiry.contactPreference}.`,
      }),
      text: `MALABAR COAST\n\nHALL ENQUIRY RECEIVED\n\nHello ${enquiry.name},\nYour request is now with our events team. This is an enquiry, not a confirmed booking.\n\nReference: ${enquiry.reference}\nPreferred date: ${preferredDate}\nPreferred time: ${enquiry.preferredTime || "Flexible"}\nEstimated guests: ${enquiry.guestCount || "Not provided"}${enquiry.occasion ? `\nOccasion: ${enquiry.occasion}` : ""}${enquiry.message ? `\nMessage: ${enquiry.message}` : ""}\n\nWe will contact you by ${enquiry.contactPreference}.\n\n${restaurantAddress}`,
    }),
    sendBrevoEmail({
      eventKey: `hall:${enquiry.id}:new:owner`,
      category: "hall_owner",
      to: { email: ownerEmail(), name: "Malabar Coast team" },
      subject: `New hall enquiry · ${preferredDate} · ${enquiry.name}`,
      html: emailFrame({
        preheader: `New private hall request from ${enquiry.name} for ${preferredDate}.`,
        eyebrow: "New hall enquiry · Follow-up needed",
        title: "A private event needs review.",
        intro: `${enquiry.name} is planning ${enquiry.occasion || "an event"} for approximately ${enquiry.guestCount || "an unspecified number of"} guests.`,
        body: noteBlock("Team action", `Check availability, review the request, and reply by ${enquiry.contactPreference}. This enquiry is not yet a confirmed booking.`, "action") + coreDetails + detailTable([
          { label: "Customer", value: enquiry.name },
          { label: "Phone", value: enquiry.phone },
          { label: "Email", value: enquiry.email },
          { label: "Contact preference", value: enquiry.contactPreference },
          { label: "Alternative date", value: enquiry.alternativeDate ? formatDate(enquiry.alternativeDate) : "Not provided" },
          { label: "Occasion", value: enquiry.occasion || "Not provided" },
        ]) + noteBlock("Customer message", enquiry.message || "No message provided"),
        cta: { label: "Review hall enquiries", href: `${siteOrigin()}/admin/hall-enquiries` },
        footerNote: "Record the first contact and decision in the hall enquiry register.",
      }),
      text: `MALABAR COAST · NEW HALL ENQUIRY\n\nACTION NEEDED\nCheck availability and reply by ${enquiry.contactPreference}. This is not yet confirmed.\n\nReference: ${enquiry.reference}\nCustomer: ${enquiry.name}\nPhone: ${enquiry.phone}\nEmail: ${enquiry.email}\nPreferred date: ${preferredDate}\nAlternative date: ${enquiry.alternativeDate ? formatDate(enquiry.alternativeDate) : "Not provided"}\nPreferred time: ${enquiry.preferredTime || "Flexible"}\nEstimated guests: ${enquiry.guestCount || "Not provided"}\nOccasion: ${enquiry.occasion || "Not provided"}\nMessage: ${enquiry.message || "No message provided"}\n\nAdmin: ${siteOrigin()}/admin/hall-enquiries`,
    }),
  ]);
}

export function reservationCancellationEmail(reservation: TableReservation) {
  const date = formatDate(reservation.bookingDate);
  const time = `${reservation.startTime}–${reservation.endTime}`;
  return {
    eventKey: `reservation:${reservation.id}:cancelled:${reservation.updatedAt}:customer`,
    category: "reservation_cancellation_customer",
    to: {email: reservation.email, name: reservation.name},
    subject: `Table booking cancelled · ${reservation.reference}`,
    html: emailFrame({
      preheader: `Your table booking ${reservation.reference} for ${date} has been cancelled.`,
      eyebrow: "Table booking update",
      title: "Your table has been cancelled.",
      intro: `${reservation.name}, your booking at Malabar Coast has been cancelled. We are sorry for any inconvenience.`,
      body: detailTable([
        {label: "Guest name", value: reservation.name},
        {label: "Booking ID", value: reservation.reference},
        {label: "Date", value: date},
        {label: "Time", value: time},
        {label: "Party size", value: `${reservation.partySize} ${reservation.partySize === 1 ? "guest" : "guests"}`},
        {label: "Contact phone", value: reservation.phone},
      ]) + noteBlock("Need another table?", "Please contact the restaurant if you would like to arrange another date or discuss this cancellation."),
      cta: {label: "Book another table", href: `${siteOrigin()}/book-a-table`},
      footerNote: "Please keep this email and your booking reference for your records.",
    }),
    text: `MALABAR COAST · TABLE BOOKING CANCELLED\n\nHello ${reservation.name},\nYour table booking has been cancelled.\n\nBooking ID: ${reservation.reference}\nGuest name: ${reservation.name}\nDate: ${date}\nTime: ${time}\nParty size: ${reservation.partySize}\nContact phone: ${reservation.phone}\n\nPlease contact the restaurant if you would like to arrange another date or discuss this cancellation.\n\n${restaurantAddress}`,
  };
}

export async function notifyReservationCancellation(reservation: TableReservation) {
  return sendBrevoEmail(reservationCancellationEmail(reservation));
}

export async function notifyHallDecision(enquiry: HallEnquiry) {
  if (!(["approved", "declined"] as const).includes(enquiry.status as "approved" | "declined")) return false;
  const approved = enquiry.status === "approved";
  const preferredDate = formatDate(enquiry.preferredDate);
  return sendBrevoEmail({
    eventKey: `hall:${enquiry.id}:${enquiry.status}:${enquiry.updatedAt}:customer`,
    category: "hall_decision",
    to: { email: enquiry.email, name: enquiry.name },
    subject: `${approved ? "Hall enquiry approved for next steps" : "Hall enquiry update"} · ${enquiry.reference}`,
    html: emailFrame({
      preheader: `An update on hall enquiry ${enquiry.reference}.`,
      eyebrow: approved ? "Ready for the next conversation" : "An update from our events team",
      title: approved ? "Your hall enquiry can move forward." : "An update on your hall enquiry.",
      intro: approved
        ? `Good news, ${enquiry.name}. We can continue planning around your preferred request.`
        : `${enquiry.name}, thank you for considering Malabar Coast for your occasion.`,
      body: detailTable([
        { label: "Guest name", value: enquiry.name },
        { label: "Enquiry reference", value: enquiry.reference },
        { label: "Status", value: approved ? "Approved for next steps" : "Unable to proceed" },
        { label: "Preferred date", value: preferredDate },
        { label: "Preferred time", value: enquiry.preferredTime || "Flexible" },
        { label: "Estimated guests", value: enquiry.guestCount || "Not provided" },
      ]) + noteBlock(approved ? "What happens next" : "What this means", approved
        ? "Our team will contact you to finalise timings, catering and event details. This approval is not a payment receipt or final event contract."
        : "We are unable to accept the requested plan at this time. Please contact the restaurant if you would like to discuss another date or a different arrangement."),
      cta: { label: approved ? "View the private hall" : "Contact the restaurant", href: `${siteOrigin()}/hall` },
      footerNote: approved ? "We look forward to planning the details with you." : "Thank you for considering Malabar Coast.",
    }),
    text: `MALABAR COAST\n\nHALL ENQUIRY UPDATE\n\nHello ${enquiry.name},\n${approved ? "Your enquiry is approved for the next planning steps." : "We are unable to accept the requested plan at this time."}\n\nEnquiry reference: ${enquiry.reference}\nGuest name: ${enquiry.name}\nPreferred date: ${preferredDate}\nPreferred time: ${enquiry.preferredTime || "Flexible"}\nEstimated guests: ${enquiry.guestCount || "Not provided"}\nStatus: ${approved ? "Approved for next steps" : "Unable to proceed"}\n\n${approved ? "Our team will contact you to finalise the details. This is not a payment receipt or final event contract." : "Please contact the restaurant if you would like to discuss another date or arrangement."}\n\n${restaurantAddress}`,
  });
}
