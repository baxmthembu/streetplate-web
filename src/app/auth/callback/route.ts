import { safeInternalPath } from "@/lib/auth-navigation";
import { rateLimitRequest } from "@/lib/security/rate-limit";
import { secureRedirect, withRateLimitHeaders } from "@/lib/security/responses";
import { isSafeAuthCode, safeSiteOrigin } from "@/lib/security/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = safeSiteOrigin(request);
  const rateLimit = await rateLimitRequest(request, "auth-callback", {
    limit: 20,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) {
    return withRateLimitHeaders(
      secureRedirect(new URL("/sign-in?error=rate_limited", origin)),
      rateLimit,
    );
  }

  const codes = url.searchParams.getAll("code");
  const code = codes.length === 1 ? codes[0] : null;
  const destination = safeInternalPath(url.searchParams.get("next"));
  if (isSafeAuthCode(code)) {
    const supabase = await createClient();
    const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? {
      error: new Error("Auth unavailable"),
    };
    if (!error) {
      return withRateLimitHeaders(
        secureRedirect(new URL(destination, origin)),
        rateLimit,
      );
    }
  }
  return withRateLimitHeaders(
    secureRedirect(new URL("/sign-in?error=callback", origin)),
    rateLimit,
  );
}
