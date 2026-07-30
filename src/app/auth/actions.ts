"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type SignInState = { message: string };

export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Enter your email address and password." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      message:
        "Authentication is not configured in this environment. Add the shared Supabase public values.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    return { message: "We could not sign you in. Check your details." };

  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
