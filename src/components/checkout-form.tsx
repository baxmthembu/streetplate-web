"use client";

import { LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-provider";
import { formatRand } from "@/lib/format";
import type { SavedAddress } from "@/lib/commerce-types";

const initialState: CheckoutState = { message: "" };

export function CheckoutForm({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [state, action, pending] = useActionState(createOrder, initialState);
  const [locationMessage, setLocationMessage] = useState("");
  const defaultAddress =
    addresses.find((address) => address.is_default) ?? addresses[0];

  useEffect(() => {
    if (state.orderId) {
      clearCart();
      router.push(
        `/checkout/payment?order=${encodeURIComponent(state.orderId)}`,
      );
    }
  }, [clearCart, router, state.orderId]);

  if (!hydrated) return <div className="empty-state">Loading checkout…</div>;
  if (items.length === 0 && !state.orderId) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add a meal before checking out.</p>
      </div>
    );
  }

  return (
    <form action={action} className="checkout-layout">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map(({ id, vendorId, vendorSlug, quantity, notes }) => ({
            id,
            vendorId,
            vendorSlug,
            quantity,
            notes,
          })),
        )}
      />
      <section className="checkout-form-panel">
        <p className="eyebrow">Delivery details</p>
        <h2>Where should we deliver?</h2>
        {addresses.length > 0 && (
          <label className="field-group">
            <span>Saved address</span>
            <select
              defaultValue={defaultAddress?.id}
              onChange={(event) => {
                const selected = addresses.find(
                  (entry) => entry.id === event.target.value,
                );
                const form = event.currentTarget.form;
                if (selected && form) {
                  (
                    form.elements.namedItem("address") as HTMLInputElement
                  ).value = selected.address;
                  (
                    form.elements.namedItem("latitude") as HTMLInputElement
                  ).value = String(selected.latitude);
                  (
                    form.elements.namedItem("longitude") as HTMLInputElement
                  ).value = String(selected.longitude);
                }
              }}
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {address.address}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="field-group">
          <span>Street address</span>
          <input
            name="address"
            defaultValue={defaultAddress?.address ?? ""}
            required
            maxLength={500}
            autoComplete="street-address"
          />
        </label>
        <div className="coordinate-grid">
          <label className="field-group">
            <span>Latitude</span>
            <input
              name="latitude"
              type="number"
              step="any"
              defaultValue={defaultAddress?.latitude ?? ""}
              required
            />
          </label>
          <label className="field-group">
            <span>Longitude</span>
            <input
              name="longitude"
              type="number"
              step="any"
              defaultValue={defaultAddress?.longitude ?? ""}
              required
            />
          </label>
        </div>
        <button
          className="button button-light locate-button"
          type="button"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!navigator.geolocation || !form)
              return setLocationMessage(
                "Location is unavailable in this browser.",
              );
            setLocationMessage("Requesting your location…");
            navigator.geolocation.getCurrentPosition(
              ({ coords }) => {
                (
                  form.elements.namedItem("latitude") as HTMLInputElement
                ).value = String(coords.latitude);
                (
                  form.elements.namedItem("longitude") as HTMLInputElement
                ).value = String(coords.longitude);
                setLocationMessage(
                  "Location added. Confirm the street address above.",
                );
              },
              () =>
                setLocationMessage(
                  "Location permission was denied. Enter the coordinates manually.",
                ),
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
            );
          }}
        >
          <LocateFixed size={17} aria-hidden="true" /> Use my current location
        </button>
        {locationMessage && (
          <p className="field-help" role="status">
            {locationMessage}
          </p>
        )}
        <label className="field-group">
          <span>Order instructions</span>
          <textarea
            name="instructions"
            maxLength={500}
            placeholder="Gate code, landmark or delivery note"
          />
        </label>
        <label className="field-group">
          <span>Driver tip (optional)</span>
          <input
            name="tip"
            type="number"
            min="0"
            max="500"
            step="1"
            defaultValue="0"
          />
        </label>
        <label className="consent-check">
          <input type="checkbox" name="terms" required />
          <span>
            I accept the terms, cancellation policy and final server-calculated
            total.
          </span>
        </label>
        {state.message && !state.orderId && (
          <p className="form-message" role="alert">
            {state.message}
          </p>
        )}
      </section>
      <aside className="cart-summary checkout-summary">
        <p className="eyebrow">Secure order</p>
        <h2>{items[0]?.vendorName}</h2>
        {items.map((item) => (
          <div key={item.id}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <strong>{formatRand(item.price * item.quantity)}</strong>
          </div>
        ))}
        <div>
          <span>Delivery fee</span>
          <strong>{formatRand(15)}</strong>
        </div>
        <div className="summary-total">
          <span>Estimated total</span>
          <strong>{formatRand(subtotal + 15)}</strong>
        </div>
        <button
          className="button button-orange button-block"
          type="submit"
          disabled={pending}
        >
          {pending ? "Creating secure order…" : "Create order and pay"}
        </button>
        <small>
          StreetPlate retrieves current menu prices on the server. PayFast
          confirms payment through its verified ITN callback.
        </small>
      </aside>
    </form>
  );
}
