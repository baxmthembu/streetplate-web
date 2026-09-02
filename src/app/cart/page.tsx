import type { Metadata } from "next";

import { Cart } from "@/components/cart";
import { DemoNotice } from "@/components/demo-notice";
import { getMarketplace } from "@/lib/streetplate-api";

export const metadata: Metadata = { title: "Your cart" };

export default async function CartPage() {
  const { meals, isDemo } = await getMarketplace();

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell">
          <p className="eyebrow">One vendor per order</p>
          <h1>Your cart</h1>
        </div>
      </section>
      <section className="shell content-page">
        {isDemo && <DemoNotice />}
        <Cart menuItems={meals} />
      </section>
    </>
  );
}
