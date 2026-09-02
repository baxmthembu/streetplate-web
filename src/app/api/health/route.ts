import { rateLimitRequest } from "@/lib/security/rate-limit";
import {
  secureJson,
  tooManyRequests,
  withRateLimitHeaders,
} from "@/lib/security/responses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimit = await rateLimitRequest(request, "health", {
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  return withRateLimitHeaders(
    secureJson({ status: "ok", service: "streetplate-web" }),
    rateLimit,
  );
}
