"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";

import { registerAccount, type AuthFormState } from "@/app/auth/actions";

const initialState: AuthFormState = { message: "" };

export function RegisterForm({
  role = "customer",
}: {
  role?: "customer" | "vendor" | "driver";
}) {
  const [state, action, pending] = useActionState(
    registerAccount,
    initialState,
  );
  return (
    <form action={action} className="auth-form onboarding-form">
      <input type="hidden" name="role" value={role} />
      <label htmlFor={`${role}-name`}>
        {role === "vendor" ? "Business name" : "Full name"}
      </label>
      <input
        id={`${role}-name`}
        name="name"
        required
        minLength={2}
        maxLength={100}
      />
      <label htmlFor={`${role}-email`}>Email address</label>
      <input
        id={`${role}-email`}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label htmlFor={`${role}-phone`}>Phone number</label>
      <input
        id={`${role}-phone`}
        name="phone"
        type="tel"
        autoComplete="tel"
        required
      />
      {role === "vendor" && (
        <>
          <label htmlFor="vendor-description">
            Tell us about your food business
          </label>
          <textarea
            id="vendor-description"
            name="description"
            maxLength={1000}
            required
          />
          <label htmlFor="vendor-address">Business address</label>
          <input id="vendor-address" name="address" maxLength={255} required />
        </>
      )}
      <label htmlFor={`${role}-password`}>Password</label>
      <input
        id={`${role}-password`}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
      />
      <small>Use uppercase, lowercase, a number and a symbol.</small>
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <label className="consent-check">
        <input type="checkbox" required />
        <span>I agree to the StreetPlate terms and privacy policy.</span>
      </label>
      <button type="submit" disabled={pending || state.success}>
        {pending
          ? "Creating account…"
          : state.success
            ? "Check your email"
            : "Create account"}
        {!pending && !state.success && (
          <ArrowRight size={18} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
