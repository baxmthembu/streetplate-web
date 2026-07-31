"use client";

import { useActionState } from "react";

import {
  requestPasswordReset,
  updatePassword,
  type AuthFormState,
} from "@/app/auth/actions";

const initialState: AuthFormState = { message: "" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  return (
    <form action={action} className="auth-form">
      <label htmlFor="reset-email">Email address</label>
      <input
        id="reset-email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      {state.message && (
        <p
          className={`form-message ${state.success ? "form-success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);
  return (
    <form action={action} className="auth-form">
      <label htmlFor="new-password">New password</label>
      <input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <label htmlFor="confirm-password">Confirm password</label>
      <input
        id="confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
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
      <button type="submit" disabled={pending || state.success}>
        {pending
          ? "Updating…"
          : state.success
            ? "Password updated"
            : "Update password"}
      </button>
    </form>
  );
}
