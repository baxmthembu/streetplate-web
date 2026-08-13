import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitsForTesting } from "@/lib/security/rate-limit";

const { exchangeCodeForSession, createClientMock } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { GET } from "./route";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.streetplate.co.za";
    createClientMock.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetRateLimitsForTesting();
  });

  it("rejects malformed codes without calling Supabase", async () => {
    const response = await GET(
      new Request("https://evil.example/auth/callback?code=short"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://www.streetplate.co.za/sign-in?error=callback",
    );
    expect(createClientMock).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("exchanges one bounded code and only redirects to an internal path", async () => {
    const code = "a".repeat(32);
    const response = await GET(
      new Request(
        `https://evil.example/auth/callback?code=${code}&next=${encodeURIComponent("//evil.example")}`,
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith(code);
    expect(response.headers.get("location")).toBe(
      "https://www.streetplate.co.za/account",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("rejects duplicated authorization codes", async () => {
    const code = "a".repeat(32);
    const response = await GET(
      new Request(
        `https://streetplate.co.za/auth/callback?code=${code}&code=${code}`,
      ),
    );

    expect(createClientMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("error=callback");
  });
});
