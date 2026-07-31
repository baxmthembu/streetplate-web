"use client";

import { useActionState } from "react";

import {
  addAddress,
  updateProfile,
  type AccountActionState,
} from "@/app/account/actions";
import type { CustomerProfile } from "@/lib/commerce-types";

const initialState: AccountActionState = { message: "" };

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  return (
    <form action={action} className="account-form">
      <label>
        Name
        <input
          name="name"
          defaultValue={profile.name}
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
          defaultValue={profile.phone ?? ""}
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
  return (
    <form action={action} className="account-form address-form">
      <label>
        Label
        <input
          name="label"
          placeholder="Home or Work"
          maxLength={50}
          required
        />
      </label>
      <label>
        Street address
        <input
          name="address"
          autoComplete="street-address"
          maxLength={500}
          required
        />
      </label>
      <div className="coordinate-grid">
        <label>
          Latitude
          <input name="latitude" type="number" step="any" required />
        </label>
        <label>
          Longitude
          <input name="longitude" type="number" step="any" required />
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
