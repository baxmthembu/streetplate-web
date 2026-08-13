"use client";

import { Minus, Plus } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { formatRand } from "@/lib/format";

export function VendorOrderAside({ vendorId }: { vendorId: string }) {
  const { items, hydrated, updateQuantity, removeItem } = useCart();
  const vendorItems = items.filter((item) => item.vendorId === vendorId);
  const subtotal = vendorItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function decreaseQuantity(itemId: string, quantity: number) {
    if (quantity <= 1) {
      removeItem(itemId);
      return;
    }
    updateQuantity(itemId, quantity - 1);
  }

  return (
    <aside className="order-aside" aria-busy={!hydrated}>
      <p className="eyebrow">Your order</p>
      <h2>
        {vendorItems.length > 0 ? "Your selections" : "Ready when you are"}
      </h2>

      {!hydrated ? (
        <p>Loading your cart…</p>
      ) : vendorItems.length === 0 ? (
        <p>Add items from this vendor to start your StreetPlate order.</p>
      ) : (
        <div className="vendor-order-items">
          {vendorItems.map((item) => (
            <div className="vendor-order-line" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>{formatRand(item.price * item.quantity)}</small>
              </div>
              <div
                className="quantity-control vendor-quantity-control"
                aria-label={`${item.name} quantity`}
              >
                <button
                  type="button"
                  onClick={() => decreaseQuantity(item.id, item.quantity)}
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label={`Increase ${item.name} quantity`}
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="vendor-order-subtotal">
        <span>Subtotal</span>
        <strong aria-label="Order subtotal" aria-live="polite">
          {formatRand(subtotal)}
        </strong>
      </div>
      <Link href="/cart" className="button button-orange">
        View cart
      </Link>
    </aside>
  );
}
