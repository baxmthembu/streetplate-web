"use client";

import { useActionState, useState } from "react";

import {
  addAddress,
  updateProfile,
  type AccountActionState,
} from "@/app/account/actions";
import type { CustomerProfile } from "@/lib/commerce-types";

const initialState: AccountActionState = { message: "" };

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  return (
    <form action={action} className="account-form">
      <label>
        Name
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={state.field === "name"}
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      <label>
        Phone number
        <input
          name="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={state.field === "phone"}
          maxLength={20}
        />
      </label>
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <button className="button button-dark" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function AddressForm() {
  const [state, action, pending] = useActionState(addAddress, initialState);
  const [values, setValues] = useState({
    label: "",
    address: "",
    latitude: "",
    longitude: "",
  });
  function updateValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }
  return (
    <form action={action} className="account-form address-form">
      <label>
        Label
        <input
          name="label"
          placeholder="Home or Work"
          maxLength={50}
          value={values.label}
          onChange={(event) => updateValue("label", event.target.value)}
          aria-invalid={state.field === "label"}
          required
        />
      </label>
      <label>
        Street address
        <input
          name="address"
          autoComplete="street-address"
          maxLength={500}
          value={values.address}
          onChange={(event) => updateValue("address", event.target.value)}
          aria-invalid={state.field === "address"}
          required
        />
      </label>
      <div className="coordinate-grid">
        <label>
          Latitude
          <input
            name="latitude"
            type="number"
            step="any"
            value={values.latitude}
            onChange={(event) => updateValue("latitude", event.target.value)}
            aria-invalid={state.field === "latitude"}
            required
          />
        </label>
        <label>
          Longitude
          <input
            name="longitude"
            type="number"
            step="any"
            value={values.longitude}
            onChange={(event) => updateValue("longitude", event.target.value)}
            aria-invalid={state.field === "longitude"}
            required
          />
        </label>
      </div>
      <label className="consent-check">
        <input name="is_default" type="checkbox" />
        <span>Use as my default address</span>
      </label>
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <button className="button button-dark" disabled={pending}>
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
