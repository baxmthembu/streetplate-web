"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  StreetPlateApiError,
  streetPlateApi,
  streetPlatePublicApi,
} from "@/lib/backend";
import { registrationConflict, signInFailure } from "@/lib/auth-error-messages";
import { safeInternalPath } from "@/lib/auth-navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

export type SignInState = { message: string; field?: "email" | "password" };
export type AuthFormState = {
  message: string;
  success?: boolean;
  field?: string;
};
export type CompleteProfileState = AuthFormState;

const registrationFieldMessages: Record<string, string> = {
  name: "Enter your full name.",
  email: "Enter a valid email address.",
  phone: "Enter a valid phone number.",
  password:
    "Use a password with at least 8 characters, including uppercase, lowercase, a number and a symbol.",
  description: "Tell us about your food business.",
  address: "Enter your business address.",
};

const emailSchema = z.email().trim().toLowerCase();
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9][0-9 ()-]*$/, "Enter a valid phone number.");
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
  const destination = safeInternalPath(
    String(formData.get("next") ?? ""),
    "/account",
  );
  const rawEmail = String(formData.get("email") ?? "").trim();
  const rawPassword = String(formData.get("password") ?? "");
  if (!rawEmail)
    return { message: "Enter your email address.", field: "email" };
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success)
    return { message: "Enter a valid email address.", field: "email" };
  if (!rawPassword)
    return { message: "Enter your password.", field: "password" };
  if (rawPassword.length > 128)
    return { message: "The password is too long.", field: "password" };

  const turnstileToken = String(
    formData.get("cf-turnstile-response") ?? "",
  ).trim();
  if (!turnstileToken)
    return { message: "Complete the security check before continuing." };

  const supabase = await createClient();
  if (!supabase) {
    return {
      message:
        "Authentication is not configured in this environment. Add the shared Supabase public values.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: rawPassword,
    options: { captchaToken: turnstileToken },
  });
  if (error) return signInFailure(error.code);

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profileError && !profile) {
    const query = new URLSearchParams({ next: destination });
    redirect(`/complete-profile?${query.toString()}`);
  }

  redirect(destination);
}

export async function completeProfile(
  _previousState: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  const roleValue = String(formData.get("role") ?? "customer");
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      phone: phoneSchema,
      password: z.string().min(8).max(128),
      role: z.enum(["customer", "vendor", "driver"]),
      description:
        roleValue === "vendor"
          ? z.string().trim().min(1).max(1000)
          : z.string().optional(),
      address:
        roleValue === "vendor"
          ? z.string().trim().min(1).max(255)
          : z.string().optional(),
    })
    .safeParse({
      name: formData.get("name"),
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
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "password"
          ? "Enter the current password for this confirmed account."
          : (registrationFieldMessages[field] ??
            "Check your account details and try again."),
      field,
    };
  }

  const destination = safeInternalPath(
    String(formData.get("next") ?? ""),
    parsed.data.role === "driver" ? "/driver" : "/account",
  );
  const turnstileToken = String(
    formData.get("cf-turnstile-response") ?? "",
  ).trim();
  if (!turnstileToken) {
    return { message: "Complete the security check before continuing." };
  }

  try {
    await streetPlateApi("/auth/profile/complete", {
      method: "POST",
      body: JSON.stringify({
        ...parsed.data,
        turnstile_token: turnstileToken,
      }),
    });
  } catch (error) {
    if (error instanceof StreetPlateApiError) {
      if (error.code === "PHONE_EXISTS") {
        return {
          message:
            "This phone number already belongs to another StreetPlate account.",
          field: "phone",
        };
      }
      if (error.code === "INVALID_PASSWORD") {
        return {
          message: "The current password is incorrect.",
          field: "password",
        };
      }
      if (error.code === "CAPTCHA_FAILED") {
        return {
          message: "The security check expired. Complete it again.",
        };
      }
      if (error.code === "EMAIL_NOT_VERIFIED") {
        return {
          message: "Confirm your email address before finishing setup.",
        };
      }
      if (error.code === "PROFILE_EXISTS") redirect(destination);
      if (error.status === 401) {
        return { message: "Your session expired. Sign in again to continue." };
      }
      if (error.status >= 500) {
        return {
          message:
            "Account setup is temporarily unavailable. Your confirmed login is safe; please retry shortly.",
        };
      }
    }
    return {
      message: "We could not finish your account setup. Please try again.",
    };
  }

  redirect(destination);
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
      phone: phoneSchema,
      password: passwordSchema,
      role: z.enum(["customer", "vendor", "driver"]),
      description:
        roleValue === "vendor"
          ? z.string().trim().min(1).max(1000)
          : z.string().optional(),
      address:
        roleValue === "vendor"
          ? z.string().trim().min(1).max(255)
          : z.string().optional(),
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
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "name" && roleValue === "vendor"
          ? "Enter your business name."
          : (registrationFieldMessages[field] ??
            "Check the details and try again."),
      field,
    };
  }

  if (formData.get("terms") !== "on") {
    return { message: "Agree to the StreetPlate terms and privacy policy." };
  }

  const turnstileToken = String(
    formData.get("cf-turnstile-response") ?? "",
  ).trim();
  if (!turnstileToken)
    return { message: "Complete the security check before continuing." };

  try {
    await streetPlatePublicApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...parsed.data,
        turnstile_token: turnstileToken,
      }),
    });
    return {
      success: true,
      message:
        "Account created. Check your email and verify the account before signing in.",
    };
  } catch (error) {
    if (error instanceof StreetPlateApiError) {
      const backendMessage = error.message.toLowerCase();
      const conflict = registrationConflict(error);
      if (conflict) return conflict;
      if (
        backendMessage.includes("turnstile") ||
        backendMessage.includes("captcha")
      ) {
        return {
          message: "The security check expired. Complete it again and retry.",
        };
      }
      if (error.status === 400) {
        if (backendMessage.includes("email")) {
          return { message: "Enter a valid email address.", field: "email" };
        }
        if (backendMessage.includes("password")) {
          return {
            message: registrationFieldMessages.password,
            field: "password",
          };
        }
        return {
          message:
            "One or more registration details are invalid. Check each field and retry.",
        };
      }
      if (error.status >= 500) {
        return {
          message:
            "Account registration is temporarily unavailable. Please try again shortly.",
        };
      }
    }
    return {
      message: "We could not create your account right now. Please try again.",
    };
  }
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    return { message: "Enter a valid email address.", field: "email" };

  const turnstileToken = String(
    formData.get("cf-turnstile-response") ?? "",
  ).trim();
  if (!turnstileToken)
    return { message: "Complete the security check before continuing." };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  try {
    await streetPlatePublicApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: parsed.data,
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        turnstile_token: turnstileToken,
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
      field: "password",
    };
  }
  if (parsed.data !== confirm)
    return {
      message: "The passwords do not match.",
      field: "confirmPassword",
    };

  const turnstile = await verifyTurnstile(formData, "password_update");
  if (!turnstile.success) return { message: turnstile.message };

  const supabase = await createClient();
  if (!supabase) return { message: "Authentication is not configured." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error?.code === "same_password") {
    return {
      message:
        "Choose a password that is different from your current password.",
      field: "password",
    };
  }
  if (error?.code === "weak_password") {
    return { message: "Choose a stronger password.", field: "password" };
  }
  if (error) return { message: "The reset link is invalid or has expired." };
  return { success: true, message: "Password updated. You can now sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
