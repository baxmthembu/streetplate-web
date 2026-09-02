import { describe, expect, it } from "vitest";

import { distanceKm, isWithinDeliveryRadius } from "./commerce-rules";

describe("distanceKm", () => {
  it("returns zero for the same point", () =>
    expect(distanceKm(-26.2041, 28.0473, -26.2041, 28.0473)).toBe(0));
  it("calculates a plausible Johannesburg to Soweto distance", () =>
    expect(distanceKm(-26.2041, 28.0473, -26.2485, 27.854)).toBeCloseTo(
      20,
      -1,
    ));
});

describe("isWithinDeliveryRadius", () => {
  const jhbCbd = { latitude: -26.2041, longitude: 28.0473 };

  it("is true when the customer is inside the vendor's radius", () => {
    const vendor = { ...jhbCbd, deliveryRadius: 5 };
    expect(isWithinDeliveryRadius(vendor, -26.2041, 28.0473)).toBe(true);
  });

  it("is false when the customer is outside the vendor's radius", () => {
    // ~20km away (Soweto), vendor only delivers 5km.
    const vendor = { ...jhbCbd, deliveryRadius: 5 };
    expect(isWithinDeliveryRadius(vendor, -26.2485, 27.854)).toBe(false);
  });

  it("stays true when vendor location is missing (can't be evaluated)", () => {
    const vendor = { latitude: null, longitude: null, deliveryRadius: 5 };
    expect(isWithinDeliveryRadius(vendor, -26.2041, 28.0473)).toBe(true);
  });

  it("stays true when vendor has no delivery radius configured", () => {
    const vendor = { ...jhbCbd, deliveryRadius: null };
    expect(isWithinDeliveryRadius(vendor, -26.2485, 27.854)).toBe(true);
  });
});
