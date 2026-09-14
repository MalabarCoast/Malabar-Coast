import type { Metadata } from "next";
import { CheckoutForm } from "../components/checkout-form";
import {getRestaurantSchedule} from "../lib/schedule-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review and pay for your Malabar Coast order.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function CheckoutPage() {
  return <CheckoutForm schedule={await getRestaurantSchedule()} />;
}
