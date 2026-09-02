import { afterEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import { getVerifiedAccessToken } from "./backend";

describe("getVerifiedAccessToken", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("treats missing Supabase configuration as an unauthenticated request", async () => {
    createClientMock.mockResolvedValueOnce(null);

    await expect(getVerifiedAccessToken()).rejects.toMatchObject({
      message: "Sign in to continue.",
      status: 401,
    });
  });

  it("returns the verified session access token", async () => {
    createClientMock.mockResolvedValueOnce({
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "customer-id" } },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "verified-access-token" } },
        }),
      },
    });

    await expect(getVerifiedAccessToken()).resolves.toBe(
      "verified-access-token",
    );
  });
});
