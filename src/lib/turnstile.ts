import "server-only";

import { headers } from "next/headers";
import { z } from "zod";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TOKEN_FIELD = "cf-turnstile-response";
const MAX_TOKEN_LENGTH = 2048;

const siteverifyResponseSchema = z.object({
  success: z.boolean(),
  action: z.string().optional(),
  hostname: z.string().optional(),
  "error-codes": z.array(z.string()).optional(),
});

export type TurnstileAction =
  "login" | "signup" | "password_reset" | "password_update";

export type TurnstileVerification =
  { success: true } | { success: false; message: string };

async function clientIpAddress() {
  try {
    const requestHeaders = await headers();
    return (
      requestHeaders.get("cf-connecting-ip")?.trim() ||
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      ""
    );
  } catch {
    return "";
  }
}

export async function verifyTurnstile(
  formData: FormData,
  expectedAction: TurnstileAction,
): Promise<TurnstileVerification> {
  const secretKey = process.env.TURNSTILE_SECRET?.trim();
  const token = String(formData.get(TOKEN_FIELD) ?? "").trim();
  const allowedHostnames = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  if (!secretKey || allowedHostnames.length === 0) {
    return {
      success: false,
      message:
        "Security verification is not configured. Please try again later.",
    };
  }

  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return {
      success: false,
      message: "Complete the security check before continuing.",
    };
  }

  const body = new URLSearchParams({ secret: secretKey, response: token });
  const remoteIp = await clientIpAddress();
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    const parsed = siteverifyResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    if (!parsed.data.success) {
      const expiredOrDuplicate = parsed.data["error-codes"]?.includes(
        "timeout-or-duplicate",
      );
      return {
        success: false,
        message: expiredOrDuplicate
          ? "The security check expired. Complete the new check and try again."
          : "Security verification failed. Please try again.",
      };
    }

    if (parsed.data.action !== expectedAction) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    if (
      !parsed.data.hostname ||
      !allowedHostnames.includes(parsed.data.hostname.toLowerCase())
    ) {
      return {
        success: false,
        message: "Security verification failed. Please try again.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Security verification is temporarily unavailable.",
    };
  }
}
