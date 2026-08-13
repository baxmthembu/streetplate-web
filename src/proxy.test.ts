import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateSessionMock } = vi.hoisted(() => ({
  updateSessionMock: vi.fn(),
}));

vi.mock("@/lib/supabase/proxy", () => ({
  updateSession: updateSessionMock,
}));

import { proxy } from "./proxy";

describe("request proxy security", () => {
  beforeEach(() => {
    updateSessionMock.mockReset();
    updateSessionMock.mockResolvedValue(NextResponse.next());
  });

  it("redirects the public production host to HTTPS", async () => {
    const response = await proxy(
      new NextRequest("http://streetplate.co.za/account?tab=addresses"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://streetplate.co.za/account?tab=addresses",
    );
    expect(updateSessionMock).not.toHaveBeenCalled();
  });

  it("honours the reverse proxy protocol when enforcing HTTPS", async () => {
    const response = await proxy(
      new NextRequest("https://www.streetplate.co.za/account", {
        headers: { "x-forwarded-proto": "http" },
      }),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://www.streetplate.co.za/account",
    );
  });

  it("updates the Supabase session for secure application requests", async () => {
    const request = new NextRequest("https://www.streetplate.co.za/account");

    await proxy(request);

    expect(updateSessionMock).toHaveBeenCalledOnce();
    expect(updateSessionMock).toHaveBeenCalledWith(request);
  });

  it("keeps local HTTP development available", async () => {
    const request = new NextRequest("http://localhost:3000/account");

    await proxy(request);

    expect(updateSessionMock).toHaveBeenCalledWith(request);
  });
});
