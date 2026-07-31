import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OrderTracker } from "@/components/order-tracker";
import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import type { CustomerOrder } from "@/lib/commerce-types";

export const metadata: Metadata = { title: "Track your order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  let order: CustomerOrder | undefined;
  let loadError = "";
  try {
    ({ order } = await streetPlateApi<{ order: CustomerOrder }>(
      `/orders/${encodeURIComponent(id)}`,
    ));
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect(`/sign-in?next=/orders/${encodeURIComponent(id)}`);
    loadError =
      error instanceof Error
        ? error.message
        : "This order could not be loaded.";
  }
  if (!order)
    return (
      <section className="shell content-page content-narrow">
        <h1>Order unavailable</h1>
        <p>{loadError}</p>
      </section>
    );
  return <OrderTracker initialOrder={order} />;
}
