import { describe, expect, it } from "vitest";

import { getSupabaseCookieOptions } from "./env";

describe("Supabase auth cookie options", () => {
  it("keeps localhost HTTP development usable", () => {
    expect(
      getSupabaseCookieOptions({
        NODE_ENV: "development",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toEqual({
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: false,
    });
  });

  it("marks cookies Secure for an HTTPS site", () => {
    expect(
      getSupabaseCookieOptions({
        NODE_ENV: "development",
        NEXT_PUBLIC_SITE_URL: "https://www.streetplate.co.za",
      }).secure,
    ).toBe(true);
  });

  it("never permits insecure cookies in production", () => {
    expect(
      getSupabaseCookieOptions({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }).secure,
    ).toBe(true);
  });
});
