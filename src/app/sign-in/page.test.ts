import { describe, expect, it } from "vitest";

import {
  getAuthCallbackMessage,
  getAuthNoticeMessage,
} from "@/lib/auth-messages";

describe("sign-in callback errors", () => {
  it("maps known callback failures to safe guidance", () => {
    expect(getAuthCallbackMessage("callback")).toMatch(/try signing in again/i);
    expect(getAuthCallbackMessage("rate_limited")).toMatch(/wait a moment/i);
  });

  it("does not render unknown query-string errors", () => {
    expect(getAuthCallbackMessage("raw backend error")).toBeUndefined();
  });

  it("maps only the allow-listed password-updated notice", () => {
    expect(getAuthNoticeMessage("password_updated")).toMatch(
      /sign in with your new password/i,
    );
    expect(getAuthNoticeMessage("raw backend message")).toBeUndefined();
  });
});
