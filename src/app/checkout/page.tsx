import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import type { SavedAddress } from "@/lib/commerce-types";
import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let addresses: SavedAddress[] = [];
  try {
    const payload = await streetPlateApi<{ addresses: SavedAddress[] }>(
      "/customers/addresses",
    );
    addresses = payload.addresses;
  } catch (error) {
    if (error instanceof StreetPlateApiError && error.status === 401)
      redirect("/sign-in?next=/checkout");
    return (
      <section className="shell content-page content-narrow">
        <p className="eyebrow">Checkout unavailable</p>
        <h1>We could not load checkout</h1>
        <p>
          StreetPlate could not verify your session or saved addresses. Please
          try again shortly.
        </p>
      </section>
    );
  }
  return (
    <section className="shell content-page">
      <div className="section-heading compact-heading checkout-header">
        <Link className="checkout-back-link" href="/cart">
          <ChevronLeft size={18} aria-hidden="true" />
          Back to cart
        </Link>
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Confirm your order</h1>
        </div>
      </div>
      <CheckoutForm addresses={addresses} />
    </section>
  );
}
