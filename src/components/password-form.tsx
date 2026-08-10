"use client";

import { useActionState, useState } from "react";

import {
  requestPasswordReset,
  updatePassword,
  type AuthFormState,
} from "@/app/auth/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialState: AuthFormState = { message: "" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="auth-form">
      <label htmlFor="reset-email">Email address</label>
      <input
        id="reset-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={state.field === "email"}
      />
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <TurnstileWidget
        action="password_reset"
        onVerifiedChange={setVerified}
        resetSignal={state}
      />
      <button type="submit" disabled={pending || !verified}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  return (
    <form action={action} className="auth-form">
      <label htmlFor="new-password">New password</label>
      <input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={state.field === "password"}
        required
      />
      <label htmlFor="confirm-password">Confirm password</label>
      <input
        id="confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        aria-invalid={state.field === "confirmPassword"}
        required
      />
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <TurnstileWidget
        action="password_update"
        onVerifiedChange={setVerified}
        resetSignal={state}
      />
      <button type="submit" disabled={pending || state.success || !verified}>
        {pending
          ? "Updating…"
          : state.success
            ? "Password updated"
            : "Update password"}
      </button>
    </form>
  );
}
