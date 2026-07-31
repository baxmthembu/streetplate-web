import { describe, expect, it } from "vitest";

import { distanceKm } from "./commerce-rules";

describe("distanceKm", () => {
  it("returns zero for the same point", () =>
    expect(distanceKm(-26.2041, 28.0473, -26.2041, 28.0473)).toBe(0));
  it("calculates a plausible Johannesburg to Soweto distance", () =>
    expect(distanceKm(-26.2041, 28.0473, -26.2485, 27.854)).toBeCloseTo(
      20,
      -1,
    ));
});
