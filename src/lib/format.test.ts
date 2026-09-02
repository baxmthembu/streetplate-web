import { describe, expect, it } from "vitest";

import { calculateCartTotal, formatMinutes, formatRand } from "./format";

describe("format helpers", () => {
  it("formats South African rand", () => {
    expect(formatRand(89.5)).toContain("89,50");
  });

  it("formats an ETA range", () => {
    expect(formatMinutes(25, 35)).toBe("25–35 min");
  });

  it("calculates totals without allowing a negative result", () => {
    expect(calculateCartTotal(100, 15, 5, 20)).toBe(100);
    expect(calculateCartTotal(10, 0, 0, 25)).toBe(0);
  });
});
