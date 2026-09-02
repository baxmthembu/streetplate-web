import { afterEach, describe, expect, it } from "vitest";

import { isSafeAuthCode, isUuid, safeSiteOrigin } from "./validation";

const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

describe("security validation", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = previousSiteUrl;
  });

  it("accepts UUIDs and rejects malformed dynamic path values", () => {
    expect(isUuid("6e411109-3c0f-4ac9-b94a-b1a11d886909")).toBe(true);
    expect(isUuid("../../admin")).toBe(false);
    expect(isUuid("6e411109-3c0f-4ac9-b94a-b1a11d88690Z")).toBe(false);
  });

  it("bounds auth codes and rejects control characters", () => {
    expect(isSafeAuthCode("a".repeat(32))).toBe(true);
    expect(isSafeAuthCode("short")).toBe(false);
    expect(isSafeAuthCode(`${"a".repeat(20)}\n`)).toBe(false);
    expect(isSafeAuthCode("a".repeat(4_097))).toBe(false);
  });

  it("uses the configured HTTPS origin instead of reflecting the request host", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.streetplate.co.za/path";
    const request = new Request("https://evil.example/auth/callback");

    expect(safeSiteOrigin(request)).toBe("https://www.streetplate.co.za");
  });
});
