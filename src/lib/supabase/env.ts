export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add the shared project's public values.",
    );
  }

  return { url, publishableKey };
}

export function getSupabaseCookieOptions(
  environment: Partial<
    Pick<NodeJS.ProcessEnv, "NODE_ENV" | "NEXT_PUBLIC_SITE_URL">
  > = process.env,
) {
  let siteUsesHttps = false;
  try {
    siteUsesHttps =
      new URL(environment.NEXT_PUBLIC_SITE_URL ?? "").protocol === "https:";
  } catch {
    // Invalid URLs are reported by the production readiness validation.
  }

  return {
    path: "/",
    sameSite: "lax" as const,
    // Supabase browser auth must read its session cookies, so HttpOnly cannot
    // be enabled without replacing the browser-side auth architecture.
    httpOnly: false,
    // Keep local HTTP development working, while always securing production.
    secure: environment.NODE_ENV === "production" || siteUsesHttps,
  };
}
