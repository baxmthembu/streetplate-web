import { describe, expect, it } from "vitest";

import { rateLimitClientKey } from "./client-ip";

describe("rateLimitClientKey", () => {
  it("uses a validated proxy IP without retaining the raw address", () => {
    const headers = new Headers({ "cf-connecting-ip": "203.0.113.8" });
    const key = rateLimitClientKey(headers);

    expect(key).toMatch(/^[0-9a-f]{24}$/);
    expect(key).not.toContain("203.0.113.8");
    expect(rateLimitClientKey(headers)).toBe(key);
  });

  it("ignores malformed values and accepts the first valid proxy address", () => {
    const expected = rateLimitClientKey(
      new Headers({ "x-real-ip": "2001:db8::1" }),
    );
    const actual = rateLimitClientKey(
      new Headers({
        "cf-connecting-ip": "not-an-ip",
        "x-forwarded-for": "2001:db8::1, 10.0.0.2",
      }),
    );

    expect(actual).toBe(expected);
  });

  it("uses a shared anonymous bucket when no validated IP is available", () => {
    expect(rateLimitClientKey(new Headers())).toBe("anonymous");
    expect(
      rateLimitClientKey(new Headers({ "x-forwarded-for": "attacker" })),
    ).toBe("anonymous");
  });
});
