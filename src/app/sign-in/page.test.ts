import { describe, expect, it } from "vitest";

import { getAuthCallbackMessage } from "@/lib/auth-messages";

describe("sign-in callback errors", () => {
  it("maps known callback failures to safe guidance", () => {
    expect(getAuthCallbackMessage("callback")).toMatch(/try signing in again/i);
    expect(getAuthCallbackMessage("rate_limited")).toMatch(/wait a moment/i);
  });

  it("does not render unknown query-string errors", () => {
    expect(getAuthCallbackMessage("raw backend error")).toBeUndefined();
  });
});
