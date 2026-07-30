import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in to StreetPlate</h1>
        <p>
          Use the same email and password as your StreetPlate mobile account.
        </p>
        <SignInForm />
        <div className="auth-links">
          <Link href="/join">Need an account?</Link>
          <Link href="/join#password-help">Forgot your password?</Link>
        </div>
      </div>
      <aside className="auth-note">
        <strong>One StreetPlate account</strong>
        <p>
          Your web session uses the same Supabase Auth project as mobile.
          Profile, favourites and orders remain shared.
        </p>
      </aside>
    </section>
  );
}
