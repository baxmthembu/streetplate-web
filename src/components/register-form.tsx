"use client";

import { ArrowRight } from "lucide-react";
import { useActionState, useState } from "react";

import { registerAccount, type AuthFormState } from "@/app/auth/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialState: AuthFormState = { message: "" };

type RegistrationValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  description: string;
  address: string;
};

export function RegisterForm({
  role = "customer",
}: {
  role?: "customer" | "vendor" | "driver";
}) {
  const [state, action, pending] = useActionState(
    registerAccount,
    initialState,
  );
  const [verified, setVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [values, setValues] = useState<RegistrationValues>({
    name: "",
    email: "",
    phone: "",
    password: "",
    description: "",
    address: "",
  });

  function updateValue(field: keyof RegistrationValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={action} className="auth-form onboarding-form">
      <input type="hidden" name="role" value={role} />
      <label htmlFor={`${role}-name`}>
        {role === "vendor" ? "Business name" : "Full name"}
      </label>
      <input
        id={`${role}-name`}
        name="name"
        value={values.name}
        onChange={(event) => updateValue("name", event.target.value)}
        aria-invalid={state.field === "name"}
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
        value={values.email}
        onChange={(event) => updateValue("email", event.target.value)}
        aria-invalid={state.field === "email"}
        required
      />
      <label htmlFor={`${role}-phone`}>Phone number</label>
      <input
        id={`${role}-phone`}
        name="phone"
        type="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={(event) => updateValue("phone", event.target.value)}
        aria-invalid={state.field === "phone"}
        maxLength={20}
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
            value={values.description}
            onChange={(event) => updateValue("description", event.target.value)}
            aria-invalid={state.field === "description"}
            maxLength={1000}
            required
          />
          <label htmlFor="vendor-address">Business address</label>
          <input
            id="vendor-address"
            name="address"
            value={values.address}
            onChange={(event) => updateValue("address", event.target.value)}
            aria-invalid={state.field === "address"}
            maxLength={255}
            required
          />
        </>
      )}
      <label htmlFor={`${role}-password`}>Password</label>
      <input
        id={`${role}-password`}
        name="password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        onChange={(event) => updateValue("password", event.target.value)}
        aria-invalid={state.field === "password"}
        minLength={8}
        maxLength={128}
        required
      />
      <small>Use uppercase, lowercase, a number and a symbol.</small>
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="alert"
        >
          {state.message}
        </p>
      )}
      <label className="consent-check">
        <input
          type="checkbox"
          name="terms"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          required
        />
        <span>I agree to the StreetPlate terms and privacy policy.</span>
      </label>
      <TurnstileWidget
        action="signup"
        onVerifiedChange={setVerified}
        resetSignal={state}
      />
      <button type="submit" disabled={pending || state.success || !verified}>
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
