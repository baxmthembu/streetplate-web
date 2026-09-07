"use client";

import {
  Banknote,
  LocateFixed,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-provider";
import { CheckoutSkeleton } from "@/components/page-skeletons";
import { formatRand } from "@/lib/format";
import type { SavedAddress } from "@/lib/commerce-types";

const initialState: CheckoutState = { message: "" };
const DELIVERY_FEE = 15;
const TIP_PRESETS = [0, 10, 20, 30];

export function CheckoutForm({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const { items, subtotal, hydrated, clearCart } = useCart();
  const [state, action, pending] = useActionState(createOrder, initialState);
  const [locationMessage, setLocationMessage] = useState("");
  const defaultAddress =
    addresses.find((address) => address.is_default) ?? addresses[0];
  const [values, setValues] = useState({
    address: defaultAddress?.address ?? "",
    latitude:
      defaultAddress?.latitude == null ? "" : String(defaultAddress.latitude),
    longitude:
      defaultAddress?.longitude == null ? "" : String(defaultAddress.longitude),
    instructions: "",
    tip: "0",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tipMode, setTipMode] = useState<"preset" | "custom">(
    TIP_PRESETS.includes(Number(values.tip)) ? "preset" : "custom",
  );

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    if (state.orderId) {
      clearCart();
      router.push(
        `/checkout/payment?order=${encodeURIComponent(state.orderId)}`,
      );
    }
  }, [clearCart, router, state.orderId]);

  if (!hydrated) return <CheckoutSkeleton />;
  if (items.length === 0 && !state.orderId) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Add a meal before checking out.</p>
      </div>
    );
  }

  const tipAmount = Number(values.tip) || 0;
  const estimatedTotal = subtotal + DELIVERY_FEE + tipAmount;

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
      <div className="checkout-main">
        <section className="checkout-card">
          <div className="checkout-card-title">
            <MapPin size={18} aria-hidden="true" />
            <h2>Delivery address</h2>
          </div>
          {addresses.length > 0 && (
            <label className="field-group">
              <span>Saved address — tap to change</span>
              <select
                defaultValue={defaultAddress?.id}
                onChange={(event) => {
                  const selected = addresses.find(
                    (entry) => entry.id === event.target.value,
                  );
                  if (selected)
                    setValues((current) => ({
                      ...current,
                      address: selected.address,
                      latitude: String(selected.latitude),
                      longitude: String(selected.longitude),
                    }));
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
              value={values.address}
              onChange={(event) => updateValue("address", event.target.value)}
              aria-invalid={state.field === "address"}
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
                value={values.latitude}
                onChange={(event) =>
                  updateValue("latitude", event.target.value)
                }
                aria-invalid={state.field === "latitude"}
                required
              />
            </label>
            <label className="field-group">
              <span>Longitude</span>
              <input
                name="longitude"
                type="number"
                step="any"
                value={values.longitude}
                onChange={(event) =>
                  updateValue("longitude", event.target.value)
                }
                aria-invalid={state.field === "longitude"}
                required
              />
            </label>
          </div>
          <button
            className="locate-button"
            type="button"
            onClick={() => {
              if (!navigator.geolocation)
                return setLocationMessage(
                  "Location is unavailable in this browser.",
                );
              setLocationMessage("Requesting your location…");
              navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                  setValues((current) => ({
                    ...current,
                    latitude: String(coords.latitude),
                    longitude: String(coords.longitude),
                  }));
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
        </section>

        <section className="checkout-card">
          <div className="checkout-card-title">
            <StickyNote size={18} aria-hidden="true" />
            <h2>Delivery instructions</h2>
          </div>
          <label className="field-group">
            <span>Notes for your driver (optional)</span>
            <textarea
              name="instructions"
              maxLength={500}
              placeholder="Gate code, landmark or delivery note"
              value={values.instructions}
              onChange={(event) =>
                updateValue("instructions", event.target.value)
              }
              aria-invalid={state.field === "instructions"}
            />
          </label>
        </section>

        <section className="checkout-card">
          <div className="checkout-card-title">
            <Banknote size={18} aria-hidden="true" />
            <h2>Add a tip for your driver</h2>
          </div>
          <div className="tip-selector">
            {TIP_PRESETS.map((amount) => {
              const active = tipMode === "preset" && tipAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  className={`tip-chip${active ? " tip-chip-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setTipMode("preset");
                    updateValue("tip", String(amount));
                  }}
                >
                  {amount === 0 ? "No tip" : `R${amount}`}
                </button>
              );
            })}
            <button
              type="button"
              className={`tip-chip${tipMode === "custom" ? " tip-chip-active" : ""}`}
              aria-pressed={tipMode === "custom"}
              onClick={() => setTipMode("custom")}
            >
              Custom
            </button>
          </div>
          {tipMode === "custom" ? (
            <label className="field-group tip-custom-field">
              <span>Custom tip amount (R)</span>
              <input
                name="tip"
                type="number"
                min="0"
                max="500"
                step="1"
                value={values.tip}
                onChange={(event) => updateValue("tip", event.target.value)}
                aria-invalid={state.field === "tip"}
              />
            </label>
          ) : (
            <input type="hidden" name="tip" value={values.tip} />
          )}
        </section>

        <label className="consent-check">
          <input
            type="checkbox"
            name="terms"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            aria-invalid={state.field === "terms"}
            required
          />
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
      </div>
      <aside className="checkout-summary">
        <p className="eyebrow">Secure order</p>
        <div className="checkout-summary-vendor">
          <ShoppingBag size={18} aria-hidden="true" />
          <h2>{items[0]?.vendorName}</h2>
        </div>
        <div className="order-item-list">
          {items.map((item) => (
            <div className="order-item-row" key={item.id}>
              <div>
                <span>
                  <span className="order-item-qty">{item.quantity}×</span>
                  {item.name}
                </span>
                {item.notes && (
                  <small className="order-item-note">{item.notes}</small>
                )}
              </div>
              <strong>{formatRand(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="payment-method-card">
          <Wallet size={18} aria-hidden="true" />
          <div>
            <span>Payment method</span>
            <strong>PayFast</strong>
          </div>
          <ShieldCheck
            className="payment-method-check"
            size={16}
            aria-hidden="true"
          />
        </div>
        <div className="price-breakdown">
          <div className="price-row">
            <span>Subtotal</span>
            <span>{formatRand(subtotal)}</span>
          </div>
          <div className="price-row">
            <span>Delivery fee</span>
            <span>{formatRand(DELIVERY_FEE)}</span>
          </div>
          <div className="price-row">
            <span>Driver tip</span>
            <span>{formatRand(tipAmount)}</span>
          </div>
          <div className="price-row price-total">
            <span>Estimated total</span>
            <span>{formatRand(estimatedTotal)}</span>
          </div>
        </div>
        <div className="checkout-cta-bar">
          <div className="checkout-cta-total">
            <span>Total</span>
            <strong>{formatRand(estimatedTotal)}</strong>
          </div>
          <button
            className="button button-orange button-block checkout-submit"
            type="submit"
            disabled={pending}
          >
            {pending ? "Creating secure order…" : "Place order"}
          </button>
        </div>
        <small>
          StreetPlate retrieves current menu prices on the server. PayFast
          confirms payment through its verified ITN callback.
        </small>
      </aside>
    </form>
  );
}
