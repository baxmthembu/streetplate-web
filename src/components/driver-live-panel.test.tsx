import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  updateDriverAvailability: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/app/driver/actions", () => ({
  respondToDriverOffer: vi.fn(async () => ({ message: "" })),
  updateDriverAvailability: mocks.updateDriverAvailability,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  }),
}));
vi.mock("socket.io-client", () => ({ io: vi.fn() }));

import { DriverLivePanel, driverSocketOptions } from "./driver-live-panel";

describe("DriverLivePanel", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.updateDriverAvailability.mockReset();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        clearWatch: vi.fn(),
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn(() => 1),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back from WebSocket to Socket.IO polling with bounded reconnects", () => {
    expect(driverSocketOptions("verified-token")).toMatchObject({
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      reconnection: true,
      reconnectionDelay: 2_000,
      reconnectionDelayMax: 15_000,
      auth: { token: "verified-token" },
    });
  });

  it("rolls the availability switch back when the server rejects the update", async () => {
    mocks.updateDriverAvailability.mockResolvedValue({
      message: "The driver service is temporarily unavailable. Retry shortly.",
    });
    const user = userEvent.setup();
    render(<DriverLivePanel initialOnline initialOrder={null} />);

    await user.click(screen.getByRole("button", { name: "Go offline" }));

    await waitFor(() =>
      expect(screen.getByText("You are online")).toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "temporarily unavailable",
    );
    expect(screen.getByRole("button", { name: "Go offline" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
