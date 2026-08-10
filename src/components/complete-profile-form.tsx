"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { completeProfile, type CompleteProfileState } from "@/app/auth/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialState: CompleteProfileState = { message: "" };

type Role = "customer" | "vendor" | "driver";

export function CompleteProfileForm({
  email,
  nextPath,
}: {
  email: string;
  nextPath?: string;
}) {
  const [state, action, pending] = useActionState(
    completeProfile,
    initialState,
  );
  const [role, setRole] = useState<Role>("customer");
  const [verified, setVerified] = useState(false);

  return (
    <form action={action} className="auth-form onboarding-form">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <label htmlFor="profile-email">Confirmed email address</label>
      <input id="profile-email" value={email} readOnly disabled />

      <label htmlFor="profile-role">How will you use StreetPlate?</label>
      <select
        id="profile-role"
        name="role"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
      >
        <option value="customer">Customer</option>
        <option value="vendor">Food vendor</option>
        <option value="driver">Delivery driver</option>
      </select>

      <label htmlFor="profile-name">
        {role === "vendor" ? "Business name" : "Full name"}
      </label>
      <input
        id="profile-name"
        name="name"
        minLength={2}
        maxLength={100}
        aria-invalid={state.field === "name"}
        required
      />

      <label htmlFor="profile-phone">Phone number</label>
      <input
        id="profile-phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        maxLength={20}
        aria-invalid={state.field === "phone"}
        required
      />

      {role === "vendor" && (
        <>
          <label htmlFor="profile-description">
            Tell us about your food business
          </label>
          <textarea
            id="profile-description"
            name="description"
            maxLength={1000}
            aria-invalid={state.field === "description"}
            required
          />
          <label htmlFor="profile-address">Business address</label>
          <input
            id="profile-address"
            name="address"
            maxLength={255}
            aria-invalid={state.field === "address"}
            required
          />
        </>
      )}

      <label htmlFor="profile-password">Current password</label>
      <input
        id="profile-password"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={8}
        maxLength={128}
        aria-invalid={state.field === "password"}
        required
      />
      <small>
        This confirms you own the existing account. Your password is never
        displayed.
      </small>

      {state.message && (
        <p className="form-message" role="alert">
          {state.message}
        </p>
      )}

      <TurnstileWidget
        action="login"
        onVerifiedChange={setVerified}
        resetSignal={state}
      />

      <button type="submit" disabled={pending || !verified}>
        {pending ? "Finishing setup…" : "Finish account setup"}
        {!pending && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}
