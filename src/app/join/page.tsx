import type { Metadata } from "next";
import { AlertTriangle, Smartphone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Join StreetPlate" };

export default function JoinPage() {
  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">One account, mobile and web</p>
          <h1>Join StreetPlate</h1>
          <p>
            Customer registration and password recovery need to preserve the
            existing mobile app&apos;s dual-authentication flow. We will not
            create incomplete or duplicate profiles.
          </p>
        </div>
      </section>
      <section className="shell content-page">
        <div className="compatibility-card">
          <AlertTriangle size={28} aria-hidden="true" />
          <div>
            <h2>Registration is held behind a compatibility gate</h2>
            <p>
              The existing backend creates both the Supabase Auth user and the
              shared public profile. A direct web sign-up could leave an orphan
              account; a direct password reset could also desynchronise mobile
              login. This phase therefore enables compatible sign-in only.
            </p>
            <p>
              The next safe step is a backwards-compatible backend auth contract
              reviewed against customer, vendor, driver and admin workflows.
            </p>
          </div>
        </div>
        <div className="join-choice-grid">
          <article>
            <Smartphone aria-hidden="true" />
            <h2>Already have an account?</h2>
            <p>
              Use your current StreetPlate details on the secure sign-in page.
            </p>
            <Link href="/sign-in" className="button button-orange">
              Sign in
            </Link>
          </article>
          <article id="password-help">
            <h2>Need account help?</h2>
            <p>
              Password recovery will be enabled once the shared auth flow can
              update both mobile and Supabase credentials safely.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
