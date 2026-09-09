"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
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
import { useActionState, useEffect, useRef, useState } from "react";

import { createOrder, type CheckoutState } from "@/app/checkout/actions";
import { useCart } from "@/components/cart-provider";
import { CheckoutSkeleton } from "@/components/page-skeletons";
import { formatRand } from "@/lib/format";
import type { SavedAddress } from "@/lib/commerce-types";

declare global {
  interface Window {
    __streetPlateGoogleMapsConfigured?: boolean;
  }
}

type PlacesLibrary = google.maps.PlacesLibrary;
type PlacePrediction = google.maps.places.PlacePrediction;

function configureGoogleMaps(apiKey: string) {
  if (!window.__streetPlateGoogleMapsConfigured) {
    setOptions({
      key: apiKey,
      v: "weekly",
      language: "en",
      region: "ZA",
      authReferrerPolicy: "origin",
    });
    window.__streetPlateGoogleMapsConfigured = true;
  }
}

let placesLibraryPromise: Promise<PlacesLibrary> | null = null;

function loadPlacesLibrary(apiKey: string) {
  if (!placesLibraryPromise) {
    configureGoogleMaps(apiKey);
    placesLibraryPromise = importLibrary("places").catch((error: unknown) => {
      placesLibraryPromise = null;
      throw error;
    });
  }
  return placesLibraryPromise;
}

let geocodingLibraryPromise: Promise<unknown> | null = null;

function loadGeocodingLibrary(apiKey: string) {
  if (!geocodingLibraryPromise) {
    configureGoogleMaps(apiKey);
    geocodingLibraryPromise = importLibrary("geocoding").catch(
      (error: unknown) => {
        geocodingLibraryPromise = null;
        throw error;
      },
    );
  }
  return geocodingLibraryPromise;
}

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

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [addressStatus, setAddressStatus] = useState("");
  const [addressError, setAddressError] = useState(() =>
    apiKey
      ? ""
      : "Address suggestions are not configured. You can still type your address manually.",
  );
  const sessionToken =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const selectedAddress = useRef(values.address);

  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    const input = values.address.trim();
    if (!apiKey || input.length < 3 || input === selectedAddress.current)
      return;

    let active = true;
    const timer = window.setTimeout(async () => {
      setAddressStatus("Finding addresses…");
      setAddressError("");
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } =
          await loadPlacesLibrary(apiKey);
        sessionToken.current ??= new AutocompleteSessionToken();
        const response =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            includedRegionCodes: ["za"],
            language: "en",
            region: "ZA",
            sessionToken: sessionToken.current,
          });
        if (!active) return;
        const nextPredictions = response.suggestions.flatMap((suggestion) =>
          suggestion.placePrediction ? [suggestion.placePrediction] : [],
        );
        setPredictions(nextPredictions);
        setHighlightedIndex(-1);
        setAddressStatus(
          nextPredictions.length
            ? `${nextPredictions.length} address suggestions available.`
            : "No matching South African addresses found.",
        );
        setAddressError("");
      } catch {
        if (!active) return;
        setPredictions([]);
        setAddressStatus(
          "Address suggestions are temporarily unavailable. You can still type your address.",
        );
        setAddressError(
          "Google address suggestions could not load. You can still type your address manually.",
        );
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [apiKey, values.address]);

  function handleAddressChange(value: string) {
    selectedAddress.current = "";
    updateValue("address", value);
    updateValue("latitude", "");
    updateValue("longitude", "");
    setPredictions([]);
    setHighlightedIndex(-1);
    setAddressStatus("");
    if (apiKey) setAddressError("");
  }

  async function selectPrediction(prediction: PlacePrediction) {
    setAddressStatus("Confirming address…");
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      const address = place.formattedAddress ?? prediction.text.text;
      const coordinates = place.location;
      selectedAddress.current = address;
      setPredictions([]);
      setHighlightedIndex(-1);
      sessionToken.current = null;
      if (coordinates) {
        setValues((current) => ({
          ...current,
          address,
          latitude: String(coordinates.lat()),
          longitude: String(coordinates.lng()),
        }));
        setAddressStatus(`Delivery address selected: ${address}`);
        setAddressError("");
      } else {
        updateValue("address", address);
        setAddressStatus(
          "Google could not confirm coordinates for this address. Choose another suggestion or type the address manually.",
        );
        setAddressError(
          "Google could not confirm coordinates for this address. Please choose another suggestion.",
        );
      }
    } catch {
      setAddressStatus(
        "Google could not confirm this address. Choose another suggestion or type the address manually.",
      );
      setAddressError(
        "Google could not confirm this address. Please choose another suggestion.",
      );
    }
  }

  function handleAddressKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!predictions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % predictions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        index <= 0 ? predictions.length - 1 : index - 1,
      );
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      void selectPrediction(predictions[highlightedIndex]);
    } else if (event.key === "Escape") {
      setPredictions([]);
      setHighlightedIndex(-1);
    }
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
                  if (selected) {
                    selectedAddress.current = selected.address;
                    setPredictions([]);
                    setHighlightedIndex(-1);
                    setAddressStatus("");
                    setAddressError("");
                    setValues((current) => ({
                      ...current,
                      address: selected.address,
                      latitude: String(selected.latitude),
                      longitude: String(selected.longitude),
                    }));
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
          <label className="field-group checkout-address-field">
            <span>Street address</span>
            <input
              name="address"
              value={values.address}
              onChange={(event) => handleAddressChange(event.target.value)}
              onKeyDown={handleAddressKeyDown}
              aria-invalid={
                state.field === "address" ||
                state.field === "latitude" ||
                state.field === "longitude"
              }
              required
              maxLength={500}
              autoComplete="street-address"
              placeholder="Start typing your delivery address"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={predictions.length > 0}
              aria-controls="checkout-address-suggestions"
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `checkout-address-option-${highlightedIndex}`
                  : undefined
              }
            />
            <input type="hidden" name="latitude" value={values.latitude} />
            <input type="hidden" name="longitude" value={values.longitude} />
            {predictions.length > 0 && (
              <div
                className="address-suggestions"
                id="checkout-address-suggestions"
                role="listbox"
                aria-label="Suggested delivery addresses"
              >
                {predictions.map((prediction, index) => (
                  <button
                    id={`checkout-address-option-${index}`}
                    className={index === highlightedIndex ? "highlighted" : ""}
                    type="button"
                    role="option"
                    aria-selected={index === highlightedIndex}
                    aria-label={[
                      prediction.mainText?.text ?? prediction.text.text,
                      prediction.secondaryText?.text,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    key={prediction.placeId}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void selectPrediction(prediction)}
                  >
                    <MapPin size={17} aria-hidden="true" />
                    <span>
                      <strong>
                        {prediction.mainText?.text ?? prediction.text.text}
                      </strong>
                      {prediction.secondaryText?.text && (
                        <small>{prediction.secondaryText.text}</small>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </label>
          <p className="sr-only" role="status" aria-live="polite">
            {addressStatus}
          </p>
          {addressError && (
            <p className="field-help" role="alert">
              {addressError}
            </p>
          )}
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
                async ({ coords }) => {
                  const latitude = String(coords.latitude);
                  const longitude = String(coords.longitude);
                  let address = values.address;
                  if (apiKey) {
                    try {
                      await loadGeocodingLibrary(apiKey);
                      const geocoder = new google.maps.Geocoder();
                      const response = await geocoder.geocode({
                        location: {
                          lat: coords.latitude,
                          lng: coords.longitude,
                        },
                      });
                      address =
                        response.results[0]?.formatted_address ?? address;
                    } catch {
                      // Coordinates are still useful when reverse geocoding is unavailable.
                    }
                  }
                  selectedAddress.current = address;
                  setPredictions([]);
                  setValues((current) => ({
                    ...current,
                    address,
                    latitude,
                    longitude,
                  }));
                  setLocationMessage(
                    "Location added. Confirm the address above.",
                  );
                },
                () =>
                  setLocationMessage(
                    "Location permission was denied. Enter the address manually.",
                  ),
                {
                  enableHighAccuracy: false,
                  timeout: 10000,
                  maximumAge: 300000,
                },
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
                  className={`tip-chip ${active ? "tip-chip-active" : ""}`}
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
              className={`tip-chip ${tipMode === "custom" ? "tip-chip-active" : ""}`}
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
