import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(
    new Headers({
      "cf-connecting-ip": "203.0.113.7",
    }),
  ),
}));

import { verifyTurnstile } from "@/lib/turnstile";

const originalSecret = process.env.TURNSTILE_SECRET;
const originalHostnames = process.env.TURNSTILE_HOSTNAMES;

function verifiedFormData() {
  const formData = new FormData();
  formData.set("cf-turnstile-response", "verified-token");
  return formData;
}

describe("verifyTurnstile", () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET = "test-secret";
    process.env.TURNSTILE_HOSTNAMES = "localhost,streetplate.test";
  });

  afterEach(() => {
    process.env.TURNSTILE_SECRET = originalSecret;
    process.env.TURNSTILE_HOSTNAMES = originalHostnames;
    vi.restoreAllMocks();
  });

  it("accepts a valid token for the expected action and hostname", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            action: "login",
            hostname: "localhost",
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(verifyTurnstile(verifiedFormData(), "login")).resolves.toEqual(
      { success: true },
    );
  });

  it("rejects missing tokens before contacting Cloudflare", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstile(new FormData(), "signup")).resolves.toEqual({
      success: false,
      message: "Complete the security check before continuing.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a valid token issued for a different form action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            action: "signup",
            hostname: "localhost",
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      verifyTurnstile(verifiedFormData(), "login"),
    ).resolves.toMatchObject({ success: false });
  });

  it("fails closed when the hostname allowlist is missing", async () => {
    delete process.env.TURNSTILE_HOSTNAMES;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyTurnstile(verifiedFormData(), "login"),
    ).resolves.toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the client IP using the canonical form-encoded request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "login",
          hostname: "localhost",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await verifyTurnstile(verifiedFormData(), "login");

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.body).toBeInstanceOf(URLSearchParams);
    expect(String(request.body)).toContain("remoteip=203.0.113.7");
  });

  it("rejects a token when Cloudflare reports that it was already used", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            action: "login",
            hostname: "localhost",
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            "error-codes": ["timeout-or-duplicate"],
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const formData = verifiedFormData();

    await expect(verifyTurnstile(formData, "login")).resolves.toEqual({
      success: true,
    });
    await expect(verifyTurnstile(formData, "login")).resolves.toMatchObject({
      success: false,
      message:
        "The security check expired. Complete the new check and try again.",
    });
  });
});
