import { afterEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitsForTesting } from "@/lib/security/rate-limit";

const { apiMock, ApiError } = vi.hoisted(() => {
  class TestApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  }
  return { apiMock: vi.fn(), ApiError: TestApiError };
});

vi.mock("@/lib/backend", () => ({
  streetPlateApi: apiMock,
  StreetPlateApiError: ApiError,
}));

import { GET } from "./route";

const validId = "6e411109-3c0f-4ac9-b94a-b1a11d886909";

function callRoute(id: string) {
  return GET(new Request(`https://streetplate.co.za/api/orders/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe("GET /api/orders/[id]", () => {
  afterEach(() => {
    apiMock.mockReset();
    resetRateLimitsForTesting();
  });

  it("rejects malformed order IDs before contacting the backend", async () => {
    const response = await callRoute("not-a-uuid");

    expect(response.status).toBe(400);
    expect(apiMock).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not expose backend error details", async () => {
    apiMock.mockRejectedValueOnce(
      new ApiError("database host and internal query details", 500),
    );

    const response = await callRoute(validId);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(502);
    expect(body.error).toBe("Order details are temporarily unavailable.");
    expect(body.error).not.toContain("database");
  });

  it("returns authenticated backend data with non-cacheable headers", async () => {
    apiMock.mockResolvedValueOnce({ order: { id: validId } });

    const response = await callRoute(validId);

    expect(response.status).toBe(200);
    expect(apiMock).toHaveBeenCalledWith(`/orders/${validId}`);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
