import { createHash } from "node:crypto";
import { isIP } from "node:net";

const forwardedHeaders = [
  "cf-connecting-ip",
  "x-real-ip",
  "x-forwarded-for",
] as const;

function validIp(value: string | null): string | null {
  if (!value) return null;

  // A proxy chain is ordered client-first. Values are never used for
  // authorization; they only provide a best-effort rate-limit partition.
  for (const candidate of value.split(",")) {
    const normalized = candidate.trim().replace(/^\[|\]$/g, "");
    if (normalized.length <= 45 && isIP(normalized)) return normalized;
  }
  return null;
}

/**
 * Returns a privacy-preserving, bounded identifier for rate limiting.
 *
 * Forwarded IP headers are supplied by the deployment proxy and must never be
 * used for authentication or authorization. A malicious direct client may be
 * able to spoof them. This helper validates their syntax, hashes the selected
 * value, and deliberately falls back to a shared anonymous bucket.
 */
export function rateLimitClientKey(headers: Headers): string {
  for (const name of forwardedHeaders) {
    const ip = validIp(headers.get(name));
    if (ip) {
      return createHash("sha256").update(ip).digest("hex").slice(0, 24);
    }
  }
  return "anonymous";
}
