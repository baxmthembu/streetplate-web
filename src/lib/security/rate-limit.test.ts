import { afterEach, describe, expect, it } from "vitest";

import {
  consumeRateLimit,
  rateLimitHeaders,
  rateLimitRequest,
  resetRateLimitsForTesting,
  setRateLimitStoreForTesting,
} from "./rate-limit";

describe("shared rate limiter", () => {
  afterEach(() => resetRateLimitsForTesting());

  it("uses a bounded local fallback during tests", async () => {
    setRateLimitStoreForTesting(null);
    const policy = { limit: 2, windowMs: 10_000 };
    const first = await consumeRateLimit("test", policy, 1_000);
    const second = await consumeRateLimit("test", policy, 2_000);
    const blocked = await consumeRateLimit("test", policy, 3_000);

    expect(first).toMatchObject({ allowed: true, remaining: 1 });
    expect(second).toMatchObject({ allowed: true, remaining: 0 });
    expect(blocked).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 8,
    });
    expect(rateLimitHeaders(blocked)).toMatchObject({ "Retry-After": "8" });
  });

  it("starts a fresh local window after the reset time", async () => {
    setRateLimitStoreForTesting(null);
    const policy = { limit: 1, windowMs: 1_000 };
    expect((await consumeRateLimit("test", policy, 10)).allowed).toBe(true);
    expect((await consumeRateLimit("test", policy, 20)).allowed).toBe(false);
    expect(await consumeRateLimit("test", policy, 1_010)).toMatchObject({
      allowed: true,
      remaining: 0,
    });
  });

  it("partitions request limits by namespace and validated client address", async () => {
    setRateLimitStoreForTesting(null);
    const policy = { limit: 1, windowMs: 60_000 };
    const firstRequest = new Request("https://streetplate.co.za/api/health", {
      headers: { "x-real-ip": "203.0.113.10" },
    });
    const secondRequest = new Request("https://streetplate.co.za/api/health", {
      headers: { "x-real-ip": "203.0.113.11" },
    });

    expect(
      (await rateLimitRequest(firstRequest, "health", policy)).allowed,
    ).toBe(true);
    expect(
      (await rateLimitRequest(firstRequest, "health", policy)).allowed,
    ).toBe(false);
    expect(
      (await rateLimitRequest(secondRequest, "health", policy)).allowed,
    ).toBe(true);
    expect(
      (await rateLimitRequest(firstRequest, "readiness", policy)).allowed,
    ).toBe(true);
  });

  it("enforces one atomic quota across concurrent application instances", async () => {
    let count = 0;
    setRateLimitStoreForTesting({
      async consume() {
        count += 1;
        return { count, ttlMs: 60_000 };
      },
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        consumeRateLimit("shared-client", { limit: 3, windowMs: 60_000 }),
      ),
    );

    expect(results.filter((result) => result.allowed)).toHaveLength(3);
    expect(results.at(-1)).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("fails closed when the distributed store is unavailable", async () => {
    setRateLimitStoreForTesting({
      async consume() {
        throw new Error("Redis unavailable");
      },
    });

    const result = await consumeRateLimit("test", {
      limit: 5,
      windowMs: 60_000,
    });

    expect(result).toMatchObject({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 60,
    });
  });
});
