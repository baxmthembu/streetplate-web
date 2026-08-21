"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import {
  StreetPlateApiError,
  streetPlateApi,
  streetPlatePublicApi,
} from "@/lib/backend";
import {
  registrationConflict,
  registrationValidationFailure,
  signInFailure,
} from "@/lib/auth-error-messages";
import {
  getSafeInternalPath,
  roleHomePath,
  safeInternalPath,
} from "@/lib/auth-navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { rateLimitClientKey } from "@/lib/security/client-ip";
import {
  consumeRateLimit,
  type RateLimitPolicy,
} from "@/lib/security/rate-limit";

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

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
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
const turnstileTokenSchema = z.string().trim().min(1).max(2048);

async function authActionAllowed(
  namespace: string,
  policy: RateLimitPolicy,
): Promise<boolean> {
  const requestHeaders = await headers();
  const key = rateLimitClientKey(requestHeaders);
  return (await consumeRateLimit(`server-action:${namespace}:${key}`, policy))
    .allowed;
}

export async function signIn(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (!(await authActionAllowed("sign-in", { limit: 10, windowMs: 900_000 }))) {
    return {
      message: "Too many sign-in attempts. Wait 15 minutes and try again.",
    };
  }
  const requestedDestination = getSafeInternalPath(
    String(formData.get("next") ?? ""),
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

  const turnstileToken = turnstileTokenSchema.safeParse(
    formData.get("cf-turnstile-response"),
  );
  if (!turnstileToken.success)
    return { message: "Complete the security check before continuing." };

  const supabase = await createClient();
  if (!supabase) {
    return {
      message: "Sign-in is temporarily unavailable. Please try again shortly.",
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: rawPassword,
    options: { captchaToken: turnstileToken.data },
  });
  if (error) return signInFailure(error.code);

  // Keep the web login visible in the same device/session list as the mobile
  // apps. Session tracking is best effort and must never block a valid login.
  await streetPlateApi("/auth/sessions/track", { method: "POST" }).catch(
    () => undefined,
  );

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profileError && !profile) {
    const query = new URLSearchParams({
      next: requestedDestination ?? "/account",
    });
    redirect(`/complete-profile?${query.toString()}`);
  }

  const destination =
    requestedDestination ?? roleHomePath(profile?.role as string | undefined);
  redirect(destination);
}

export async function completeProfile(
  _previousState: CompleteProfileState,
  formData: FormData,
): Promise<CompleteProfileState> {
  if (
    !(await authActionAllowed("complete-profile", {
      limit: 10,
      windowMs: 900_000,
    }))
  ) {
    return { message: "Too many attempts. Wait 15 minutes and try again." };
  }
  const roleValue = String(formData.get("role") ?? "customer");
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
      phone: phoneSchema,
      password: z.string().min(8).max(128),
      role: z.enum(["customer", "vendor", "driver"]),
      description:
        roleValue === "vendor"
          ? z
              .string()
              .trim()
              .min(1)
              .max(1000)
              .refine(
                (value) =>
                  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
              )
          : z.string().optional(),
      address:
        roleValue === "vendor"
          ? z
              .string()
              .trim()
              .min(1)
              .max(255)
              .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
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
    roleHomePath(parsed.data.role),
  );
  const turnstileToken = turnstileTokenSchema.safeParse(
    formData.get("cf-turnstile-response"),
  );
  if (!turnstileToken.success) {
    return { message: "Complete the security check before continuing." };
  }

  try {
    await streetPlateApi("/auth/profile/complete", {
      method: "POST",
      body: JSON.stringify({
        ...parsed.data,
        turnstile_token: turnstileToken.data,
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
  if (
    !(await authActionAllowed("register", {
      limit: 5,
      windowMs: 3_600_000,
    }))
  ) {
    return {
      message: "Too many registration attempts. Wait an hour and try again.",
    };
  }
  const roleValue = String(formData.get("role") ?? "customer");
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
      email: emailSchema,
      phone: phoneSchema,
      password: passwordSchema,
      role: z.enum(["customer", "vendor", "driver"]),
      description:
        roleValue === "vendor"
          ? z
              .string()
              .trim()
              .min(1)
              .max(1000)
              .refine(
                (value) =>
                  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
              )
          : z.string().optional(),
      address:
        roleValue === "vendor"
          ? z
              .string()
              .trim()
              .min(1)
              .max(255)
              .refine((value) => !/[\u0000-\u001f\u007f]/.test(value))
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

  const turnstileToken = turnstileTokenSchema.safeParse(
    formData.get("cf-turnstile-response"),
  );
  if (!turnstileToken.success)
    return { message: "Complete the security check before continuing." };

  const registrationPayload = {
    ...parsed.data,
    turnstile_token: turnstileToken.data,
  };

  try {
    try {
      await streetPlatePublicApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(registrationPayload),
      });
    } catch (error) {
      const backendDoesNotAcceptTurnstile =
        error instanceof StreetPlateApiError &&
        error.status === 400 &&
        error.message.toLowerCase().includes("unknown field");

      if (!backendDoesNotAcceptTurnstile) throw error;

      // Compatibility for the currently deployed strict registration route:
      // verify the token canonically on the web server, then send only fields
      // accepted by that older backend contract.
      const verification = await verifyTurnstile(formData, "signup");
      if (!verification.success) {
        return { message: verification.message };
      }

      await streetPlatePublicApi("/auth/register", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
    }
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
        const fieldFailure = registrationValidationFailure(
          error.field,
          parsed.data.role,
        );
        if (fieldFailure) return fieldFailure;

        if (
          backendMessage.includes("phone") ||
          backendMessage.includes("telephone") ||
          backendMessage.includes("mobile")
        ) {
          return {
            message:
              "Enter a valid South African phone number, for example 071 234 5678.",
            field: "phone",
          };
        }
        if (
          backendMessage.includes("business") ||
          backendMessage.includes("name")
        ) {
          return {
            message: "Enter your business name between 2 and 100 characters.",
            field: "name",
          };
        }
        if (backendMessage.includes("description")) {
          return {
            message:
              "Tell us about your food business in 1 to 1,000 characters.",
            field: "description",
          };
        }
        if (backendMessage.includes("address")) {
          return {
            message:
              "Enter your business address between 1 and 255 characters.",
            field: "address",
          };
        }
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
            "Your form fields passed validation, but the registration service rejected the request without identifying an input. Complete a new security check and retry.",
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
  if (
    !(await authActionAllowed("password-reset-request", {
      limit: 5,
      windowMs: 3_600_000,
    }))
  ) {
    return {
      success: true,
      message: "If that account exists, a password reset email has been sent.",
    };
  }
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    return { message: "Enter a valid email address.", field: "email" };

  const turnstileToken = turnstileTokenSchema.safeParse(
    formData.get("cf-turnstile-response"),
  );
  if (!turnstileToken.success)
    return { message: "Complete the security check before continuing." };

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  try {
    const supabase = await createClient();
    await supabase?.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${siteUrl}/reset-password`,
      captchaToken: turnstileToken.data,
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
  if (
    !(await authActionAllowed("password-update", {
      limit: 10,
      windowMs: 900_000,
    }))
  ) {
    return { message: "Too many attempts. Wait 15 minutes and try again." };
  }
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
