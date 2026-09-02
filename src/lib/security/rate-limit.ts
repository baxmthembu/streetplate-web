import { createHash } from "node:crypto";

import { Redis } from "@upstash/redis";

import { rateLimitClientKey } from "./client-ip";

export type RateLimitPolicy = Readonly<{
  limit: number;
  windowMs: number;
}>;

type WindowEntry = {
  count: number;
  resetAt: number;
};

type DistributedRateLimitStore = {
  consume(
    key: string,
    windowMs: number,
  ): Promise<{
    count: number;
    ttlMs: number;
  }>;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const MAX_TRACKED_KEYS = 10_000;
const windows = new Map<string, WindowEntry>();
let redisStore: DistributedRateLimitStore | undefined;
let testStore: DistributedRateLimitStore | null | undefined;

const FIXED_WINDOW_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { count, ttl }
`;

function validatePolicy(policy: RateLimitPolicy) {
  if (!Number.isSafeInteger(policy.limit) || policy.limit < 1) {
    throw new RangeError("Rate-limit policy limit must be a positive integer.");
  }
  if (!Number.isSafeInteger(policy.windowMs) || policy.windowMs < 1_000) {
    throw new RangeError(
      "Rate-limit policy window must be at least one second.",
    );
  }
}

function pruneExpired(now: number) {
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}

function enforceCapacity(now: number) {
  if (windows.size < MAX_TRACKED_KEYS) return;
  pruneExpired(now);
  if (windows.size < MAX_TRACKED_KEYS) return;

  // Maps retain insertion order. Evicting the oldest entry bounds memory even
  // when an attacker continuously supplies new, syntactically valid IPs.
  const oldestKey = windows.keys().next().value as string | undefined;
  if (oldestKey) windows.delete(oldestKey);
}

function consumeLocalRateLimit(
  key: string,
  policy: RateLimitPolicy,
  now: number,
): RateLimitResult {
  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    enforceCapacity(now);
    entry = { count: 0, resetAt: now + policy.windowMs };
    windows.set(key, entry);
  }

  entry.count += 1;
  const allowed = entry.count <= policy.limit;
  return {
    allowed,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
  };
}

function isDeployedEnvironment() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

function allowLocalFallback() {
  return !isDeployedEnvironment();
}

function distributedKey(key: string) {
  const environment =
    process.env.RATE_LIMIT_NAMESPACE?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.NODE_ENV ||
    "local";
  const digest = createHash("sha256").update(key).digest("hex");
  return `streetplate:rate-limit:v1:${environment}:${digest}`;
}

function getDistributedStore(): DistributedRateLimitStore | null {
  if (testStore !== undefined) return testStore;

  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;

  if (!redisStore) {
    const redis = new Redis({ url, token });
    redisStore = {
      async consume(key, windowMs) {
        const result = await redis.eval<string[], [number, number]>(
          FIXED_WINDOW_SCRIPT,
          [key],
          [String(windowMs)],
        );
        const count = Number(result[0]);
        const ttlMs = Number(result[1]);
        if (!Number.isSafeInteger(count) || count < 1 || ttlMs < 0) {
          throw new Error("Invalid distributed rate-limit response.");
        }
        return { count, ttlMs };
      },
    };
  }
  return redisStore;
}

function unavailableResult(
  policy: RateLimitPolicy,
  now: number,
): RateLimitResult {
  return {
    allowed: false,
    limit: policy.limit,
    remaining: 0,
    resetAt: now + policy.windowMs,
    retryAfterSeconds: Math.max(1, Math.ceil(policy.windowMs / 1_000)),
  };
}

export async function consumeRateLimit(
  key: string,
  policy: RateLimitPolicy,
  now = Date.now(),
): Promise<RateLimitResult> {
  validatePolicy(policy);
  const store = getDistributedStore();

  if (!store) {
    if (allowLocalFallback()) return consumeLocalRateLimit(key, policy, now);
    console.error(
      "[SECURITY] Distributed rate limiter is not configured; request denied.",
    );
    return unavailableResult(policy, now);
  }

  try {
    const { count, ttlMs } = await store.consume(
      distributedKey(key),
      policy.windowMs,
    );
    const resetAt = now + ttlMs;
    return {
      allowed: count <= policy.limit,
      limit: policy.limit,
      remaining: Math.max(0, policy.limit - count),
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1_000)),
    };
  } catch {
    console.error(
      "[SECURITY] Distributed rate limiter is unavailable; request denied.",
    );
    return unavailableResult(policy, now);
  }
}

export async function rateLimitRequest(
  request: Request,
  namespace: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const clientKey = rateLimitClientKey(request.headers);
  return consumeRateLimit(`${namespace}:${clientKey}`, policy);
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

/** Injects a shared fake store for focused tests without contacting Redis. */
export function setRateLimitStoreForTesting(
  store: DistributedRateLimitStore | null,
) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Rate-limit stores can only be replaced in tests.");
  }
  testStore = store;
}

/** Test-only reset for both the local limiter and cached test dependencies. */
export function resetRateLimitsForTesting() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Rate limits can only be reset in tests.");
  }
  windows.clear();
  testStore = undefined;
  redisStore = undefined;
}
