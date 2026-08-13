import { describe, expect, it } from "vitest";

import { vendorTransitions } from "@/lib/vendor-types";

describe("vendor order transitions", () => {
  it("matches the existing backend vendor lifecycle", () => {
    expect(vendorTransitions.pending).toEqual(["confirmed", "cancelled"]);
    expect(vendorTransitions.confirmed).toEqual(["preparing", "cancelled"]);
    expect(vendorTransitions.preparing).toEqual([
      "ready_for_pickup",
      "cancelled",
    ]);
    expect(vendorTransitions.ready_for_pickup).toBeUndefined();
  });
});
