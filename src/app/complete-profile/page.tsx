import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CompleteProfileForm } from "@/components/complete-profile-form";
import { getSafeInternalPath } from "@/lib/auth-navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Finish account setup" };
export const dynamic = "force-dynamic";

export default async function CompleteProfilePage({
  searchParams,
}: PageProps<"/complete-profile">) {
  const params = await searchParams;
  const rawNext = params.next;
  const nextPath = getSafeInternalPath(
    typeof rawNext === "string" ? rawNext : undefined,
  );
  const supabase = await createClient();
  if (!supabase) redirect("/sign-in");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    const query = nextPath
      ? `?${new URLSearchParams({ next: nextPath }).toString()}`
      : "";
    redirect(`/sign-in${query}`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) {
    redirect(nextPath ?? (profile.role === "driver" ? "/driver" : "/account"));
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">One last step</p>
        <h1>Finish your StreetPlate profile</h1>
        <p>
          Your email is already confirmed. Add the missing profile details to
          use the same account on web and mobile.
        </p>
        <CompleteProfileForm
          email={user.email}
          nextPath={nextPath ?? undefined}
        />
      </div>
      <aside className="auth-note">
        <p className="eyebrow">Your account is safe</p>
        <h2>We will keep your confirmed login</h2>
        <p>
          StreetPlate only creates the missing profile after confirming your
          current password. It does not delete or replace your Supabase Auth
          account.
        </p>
      </aside>
    </section>
  );
}
