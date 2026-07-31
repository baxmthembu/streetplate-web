import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Join StreetPlate" };

export default function JoinPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">One account, mobile and web</p>
        <h1>Join StreetPlate</h1>
        <p>
          Create a customer account through the existing shared backend so your
          Auth identity and StreetPlate profile are created together.
        </p>
        <RegisterForm />
        <div className="auth-links">
          <Link href="/sign-in">Already have an account?</Link>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
      <aside className="auth-note">
        <strong>Verify before ordering</strong>
        <p>
          After registering, use the email verification link before signing in.
          Your profile, favourites and orders stay shared with mobile.
        </p>
      </aside>
    </section>
  );
}
