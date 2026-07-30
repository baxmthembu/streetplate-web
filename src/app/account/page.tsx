import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <section className="shell content-page content-narrow">
        <p className="eyebrow">Configuration required</p>
        <h1>Connect the shared Supabase project</h1>
        <p>
          Add the shared public project URL and publishable key to
          <code> .env.local </code> to enable secure account sessions.
        </p>
      </section>
    );
  }

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/sign-in");

  return (
    <section className="shell content-page content-narrow">
      <p className="eyebrow">Signed in</p>
      <h1>Your StreetPlate account</h1>
      <p>
        Profile, saved addresses, favourites and orders will be enabled here as
        each shared-table policy is verified against mobile workflows.
      </p>
      <form action={signOut}>
        <button className="button button-dark" type="submit">
          Sign out
        </button>
      </form>
    </section>
  );
}
