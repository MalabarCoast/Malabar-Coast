import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusRefresh } from "../../components/order-status-refresh";
import { hasOrderAccess } from "../../lib/order-access";
import { getOrder } from "../../lib/order-store";
import { inferPaymentStatus, orderStatusLabels, paymentStatusLabels } from "../../lib/orders";
import { isValidOrderId } from "../../lib/security";

export const dynamic = "force-dynamic";

const money = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const statusCopy = {
  pending_payment: "The payment provider has not confirmed funds yet. Keep this page open or return shortly.",
  paid: "Payment is confirmed. The restaurant can now accept the order into its kitchen workflow.",
  confirmed: "The restaurant has confirmed the order and its requested fulfilment details.",
  preparing: "The kitchen is preparing the order.",
  ready: "The order is ready for its next fulfilment step.",
  out_for_delivery: "The order has left the restaurant for delivery.",
  completed: "The order has completed its fulfilment journey.",
  payment_failed: "The payment provider did not complete this payment. Return to checkout to try again.",
  cancelled: "This payment or order was cancelled.",
  expired: "The payment session expired before payment was confirmed.",
  payment_partially_refunded: "Part of this payment has been refunded, so fulfilment is paused while the order is reconciled.",
  refunded: "The payment has been refunded. Contact the restaurant if you need help with the refund timeline.",
  payment_disputed: "The payment is under dispute, so fulfilment has been paused while it is reviewed.",
  payment_reversed: "The payment was reversed after confirmation, so fulfilment has been paused securely.",
} as const;

export default async function CustomerOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidOrderId(id) || !(await hasOrderAccess(id))) notFound();
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <main className="customerOrderPage">
      <header>
        <p>Your order · Secure status</p>
        <h1>{orderStatusLabels[order.status]}.</h1>
        <span>{statusCopy[order.status]}</span>
        <OrderStatusRefresh orderId={order.id} initialStatus={order.status} />
      </header>
      <section className="customerOrderSummary" aria-labelledby="order-summary-title">
        <div><p>Order reference</p><h2 id="order-summary-title">{order.id}</h2></div>
        <dl>
          <div><dt>Payment</dt><dd>{paymentStatusLabels[inferPaymentStatus(order)]}</dd></div>
          <div><dt>Method</dt><dd>{order.fulfilment}</dd></div>
          <div><dt>Requested</dt><dd>{order.requestedTime.replace("T", " ")}</dd></div>
          {(order.discountPence ?? 0) > 0 && <div><dt>Discount</dt><dd>{order.discountCode} · {order.discountPercent}% off food</dd></div>}
          <div><dt>Total</dt><dd>{money(order.totalPence)}</dd></div>
        </dl>
      </section>
      <section className="customerOrderLines" aria-labelledby="order-items-title">
        <p>Server-confirmed basket</p><h2 id="order-items-title">Order details</h2>
        <div>{order.lines.map((line) => <article key={line.menuItemId}><span>{line.quantity} ×</span><strong>{line.name}</strong><b>{money(line.lineTotalPence)}</b></article>)}</div>
      </section>
      <nav className="customerOrderActions" aria-label="Order links">
        <Link href="/menu">Return to the menu <span aria-hidden="true">↗</span></Link>
        <Link href="/">Restaurant home <span aria-hidden="true">→</span></Link>
      </nav>
    </main>
  );
}
