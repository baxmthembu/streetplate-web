import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password</h1>
        <p>We will send a secure recovery link if the account exists.</p>
        <ForgotPasswordForm />
        <div className="auth-links">
          <Link href="/sign-in">Back to sign in</Link>
        </div>
      </div>
      <aside className="auth-note">
        <strong>Private by design</strong>
        <p>
          StreetPlate does not reveal whether an email address is registered.
        </p>
      </aside>
    </section>
  );
}
