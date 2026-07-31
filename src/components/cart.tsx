"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { formatRand } from "@/lib/format";

const deliveryFee = 15;

export function Cart() {
  const { items, hydrated, subtotal, updateQuantity, updateNotes, removeItem } =
    useCart();

  if (!hydrated) {
    return <div className="empty-state">Loading your saved cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="empty-state cart-empty">
        <h2>Your cart is empty</h2>
        <p>Browse nearby vendors and add a meal to begin.</p>
        <Link className="button button-orange" href="/discover">
          Find food
        </Link>
      </div>
    );
  }

  const total = subtotal + deliveryFee;
  return (
    <div className="cart-layout">
      <section className="cart-items">
        <div className="cart-vendor">
          <span>{items[0].vendorName.slice(0, 1)}</span>
          <div>
            <p className="eyebrow">One vendor per order</p>
            <h2>{items[0].vendorName}</h2>
          </div>
        </div>
        {items.map((item) => (
          <article className="cart-line cart-line-live" key={item.id}>
            <div className="meal-visual tone-coral" aria-hidden="true">
              {item.name.slice(0, 1)}
            </div>
            <div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong>{formatRand(item.price)}</strong>
              <label className="item-notes">
                <span>Special instructions</span>
                <input
                  value={item.notes}
                  onChange={(event) => updateNotes(item.id, event.target.value)}
                  maxLength={300}
                  placeholder="e.g. no atchar"
                />
              </label>
            </div>
            <div
              className="quantity-control"
              aria-label={`${item.name} quantity`}
            >
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                aria-label={`Decrease ${item.name} quantity`}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span aria-live="polite">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                aria-label={`Increase ${item.name} quantity`}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            <button
              className="remove-line"
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 size={18} aria-hidden="true" />
            </button>
          </article>
        ))}
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
          <strong>{formatRand(deliveryFee)}</strong>
        </div>
        <div className="summary-total">
          <span>Estimated total</span>
          <strong>{formatRand(total)}</strong>
        </div>
        <Link className="button button-orange button-block" href="/checkout">
          Continue to checkout
        </Link>
        <small>
          The backend rechecks item availability and calculates canonical prices
          before creating the order.
        </small>
      </aside>
    </div>
  );
}
