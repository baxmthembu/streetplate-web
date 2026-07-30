"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { signIn, type SignInState } from "@/app/auth/actions";

const initialState: SignInState = { message: "" };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="auth-form">
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.message && (
        <p className="form-message" role="status">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}
