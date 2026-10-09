import type { Metadata } from "next";
import { CheckoutForm } from "../components/checkout-form";
import {getRestaurantSchedule} from "../lib/schedule-store";
import {getServiceAvailability} from "../lib/service-availability-store";
import {publicServiceAvailability} from "../lib/service-availability";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review and pay for your Malabar Coast order.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function CheckoutPage() {
  const [schedule, serviceAvailability] = await Promise.all([getRestaurantSchedule(), getServiceAvailability()]);
  return <CheckoutForm schedule={schedule} availability={publicServiceAvailability(serviceAvailability)} />;
}
