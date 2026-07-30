import type { Metadata } from "next";

import { CartPreview } from "@/components/cart-preview";
import { DemoNotice } from "@/components/demo-notice";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell">
          <p className="eyebrow">One vendor per order</p>
          <h1>Your cart</h1>
        </div>
      </section>
      <section className="shell content-page">
        <DemoNotice />
        <CartPreview />
      </section>
    </>
  );
}
