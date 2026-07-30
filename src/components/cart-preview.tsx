"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { calculateCartTotal, formatRand } from "@/lib/format";

const unitPrice = 48;
const deliveryFee = 14;
const serviceFee = 5;

export function CartPreview() {
  const [quantity, setQuantity] = useState(1);
  const [removed, setRemoved] = useState(false);
  const subtotal = removed ? 0 : unitPrice * quantity;
  const total = calculateCartTotal(
    subtotal,
    removed ? 0 : deliveryFee,
    removed ? 0 : serviceFee,
  );

  return (
    <div className="cart-layout">
      <section className="cart-items">
        <div className="cart-vendor">
          <span>K</span>
          <div>
            <p className="eyebrow">Preview vendor</p>
            <h2>Soweto Kota Corner</h2>
          </div>
        </div>
        {removed ? (
          <div className="empty-state">
            <h3>Your cart is empty.</h3>
            <p>Add a meal from one vendor to start an order.</p>
          </div>
        ) : (
          <article className="cart-line">
            <div className="meal-visual tone-coral">K</div>
            <div>
              <h3>Classic Kota</h3>
              <p>Fresh bread, chips, atchar, polony and egg.</p>
              <strong>{formatRand(unitPrice)}</strong>
            </div>
            <div className="quantity-control" aria-label="Item quantity">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <button
              className="remove-line"
              type="button"
              onClick={() => setRemoved(true)}
              aria-label="Remove Classic Kota"
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </article>
        )}
      </section>
      <aside className="cart-summary">
        <p className="eyebrow">Order summary</p>
        <h2>Your total</h2>
        <div>
          <span>Subtotal</span>
          <strong>{formatRand(subtotal)}</strong>
        </div>
        <div>
          <span>Delivery fee</span>
          <strong>{formatRand(removed ? 0 : deliveryFee)}</strong>
        </div>
        <div>
          <span>Service fee</span>
          <strong>{formatRand(removed ? 0 : serviceFee)}</strong>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <strong>{formatRand(total)}</strong>
        </div>
        <button type="button" disabled>
          Checkout integration pending
        </button>
        <small>
          Preview only. Prices and totals are design fixtures. Production
          checkout will calculate trusted totals on the existing backend.
        </small>
      </aside>
    </div>
  );
}
