import { describe, expect, it } from "vitest";

import { driverStatusAction, driverTransitions } from "./driver-types";

describe("driver delivery transitions", () => {
  it("matches the existing backend transition contract", () => {
    expect(driverTransitions).toEqual({
      confirmed: "picked_up",
      ready_for_pickup: "picked_up",
      picked_up: "on_the_way",
      on_the_way: "delivered",
    });
  });

  it("does not expose a driver action for vendor-owned or terminal statuses", () => {
    expect(driverTransitions.preparing).toBeUndefined();
    expect(driverTransitions.delivered).toBeUndefined();
    expect(driverTransitions.cancelled).toBeUndefined();
    expect(driverStatusAction.preparing).toBeUndefined();
  });
});
