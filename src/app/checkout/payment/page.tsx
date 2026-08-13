import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PayFastForm } from "@/components/payfast-form";
import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";

export const metadata: Metadata = { title: "Secure payment" };
export const dynamic = "force-dynamic";

export default async function PaymentPage({
  searchParams,
}: PageProps<"/checkout/payment">) {
  const { order } = await searchParams;
  if (typeof order !== "string" || !order) redirect("/account");
  let payload:
    | {
        paymentUrl: string;
        paymentData: Record<string, string | number>;
        environment: "sandbox" | "live";
      }
    | undefined;
  let loadError = "";
  try {
    payload = await streetPlateApi<{
      paymentUrl: string;
      paymentData: Record<string, string | number>;
      environment: "sandbox" | "live";
    }>(`/payments/data?order_id=${encodeURIComponent(order)}`);
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect("/sign-in");
    if (error instanceof StreetPlateApiError && error.status === 409) {
      loadError = "This order is no longer awaiting payment.";
    } else if (error instanceof StreetPlateApiError && error.status === 404) {
      loadError = "We could not find this order.";
    } else {
      loadError = "Please try again shortly from your order history.";
    }
  }
  if (!payload)
    return (
      <section className="shell content-page content-narrow">
        <h1>Payment is temporarily unavailable</h1>
        <p>{loadError}</p>
        <Link className="button button-dark" href={`/orders/${order}`}>
          View order
        </Link>
      </section>
    );
  return (
    <section className="shell content-page content-narrow">
      <p className="eyebrow">Order created</p>
      <h1>Complete payment with PayFast</h1>
      <p>
        Your order remains pending until PayFast sends a verified payment
        notification to StreetPlate.
      </p>
      {payload.environment === "sandbox" ? (
        <p role="status">
          Sandbox checkout is active. No real money will be charged.
        </p>
      ) : null}
      <PayFastForm
        paymentUrl={payload.paymentUrl}
        paymentData={payload.paymentData}
      />
      <Link className="button button-dark" href={`/orders/${order}`}>
        Track order status
      </Link>
    </section>
  );
}
