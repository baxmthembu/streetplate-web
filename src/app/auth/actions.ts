"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { streetPlatePublicApi } from "@/lib/backend";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { message: string };
export type AuthFormState = { message: string; success?: boolean };

const emailSchema = z.email().trim().toLowerCase();
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128)
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a symbol.");

export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = z
    .string()
    .min(1)
    .max(128)
    .safeParse(formData.get("password"));

  if (!email.success || !password.success) {
    return { message: "Enter your email address and password." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      message:
        "Authentication is not configured in this environment. Add the shared Supabase public values.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });
  if (error)
    return { message: "We could not sign you in. Check your details." };

  redirect("/account");
}

export async function registerAccount(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const roleValue = String(formData.get("role") ?? "customer");
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      email: emailSchema,
      phone: z.string().trim().min(7).max(20),
      password: passwordSchema,
      role: z.enum(["customer", "vendor", "driver"]),
      description: z.string().trim().max(1000).optional(),
      address: z.string().trim().max(255).optional(),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      password: formData.get("password"),
      role: roleValue,
      description:
        roleValue === "vendor"
          ? String(formData.get("description") ?? "")
          : undefined,
      address:
        roleValue === "vendor"
          ? String(formData.get("address") ?? "")
          : undefined,
    });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }

  try {
    await streetPlatePublicApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    return {
      success: true,
      message:
        "Account created. Check your email and verify the account before signing in.",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "We could not create the account.",
    };
  }
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { message: "Enter a valid email address." };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  try {
    await streetPlatePublicApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.data,
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      }),
    });
  } catch {
    // Keep the response enumeration-safe even if the backend is unavailable.
  }
  return {
    success: true,
    message: "If that account exists, a password reset email has been sent.",
  };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Use a stronger password.",
    };
  }
  if (parsed.data !== confirm)
    return { message: "The passwords do not match." };

  const supabase = await createClient();
  if (!supabase) return { message: "Authentication is not configured." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { message: "The reset link is invalid or has expired." };
  return { success: true, message: "Password updated. You can now sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
