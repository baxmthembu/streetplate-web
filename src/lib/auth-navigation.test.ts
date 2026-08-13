import { describe, expect, it } from "vitest";

import {
  getSafeInternalPath,
  roleHomePath,
  safeInternalPath,
} from "./auth-navigation";

describe("auth navigation", () => {
  it("keeps valid internal destinations", () => {
    expect(getSafeInternalPath("/checkout")).toBe("/checkout");
    expect(getSafeInternalPath("/orders/123?view=summary#status")).toBe(
      "/orders/123?view=summary#status",
    );
  });

  it.each([
    "https://example.com/checkout",
    "//example.com/checkout",
    "/\\example.com/checkout",
    "checkout",
    "",
  ])("rejects unsafe destination %s", (destination) => {
    expect(getSafeInternalPath(destination)).toBeNull();
  });

  it("uses the account page as the default destination", () => {
    expect(safeInternalPath("//example.com/checkout")).toBe("/account");
  });

  it("routes each account role to its own workspace", () => {
    expect(roleHomePath("customer")).toBe("/account");
    expect(roleHomePath("vendor")).toBe("/vendor");
    expect(roleHomePath("driver")).toBe("/driver");
    expect(roleHomePath("admin")).toBe("/account");
  });
});
