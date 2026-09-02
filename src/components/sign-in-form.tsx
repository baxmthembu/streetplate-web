"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";

import { signIn, type SignInState } from "@/app/auth/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const initialState: SignInState = { message: "" };

export function SignInForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="auth-form">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={state.field === "email"}
        required
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={state.field === "password"}
        maxLength={128}
        required
      />
      <TurnstileWidget
        action="login"
        onVerifiedChange={setVerified}
        resetSignal={state}
      />
      {state.message && (
        <p className="form-message" role="alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending || !verified}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </form>
  );
}
