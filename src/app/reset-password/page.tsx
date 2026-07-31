import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/password-form";

export const metadata: Metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Secure reset</p>
        <h1>Choose a new password</h1>
        <p>
          Use a unique password with uppercase, lowercase, a number and a
          symbol.
        </p>
        <ResetPasswordForm />
      </div>
      <aside className="auth-note">
        <strong>One shared identity</strong>
        <p>
          Your updated Supabase credential is used for StreetPlate web sessions
          and compatible API access.
        </p>
      </aside>
    </section>
  );
}
