import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getVendorEarnings: vi.fn(),
  getVendorPayouts: vi.fn(),
  getVendorWallet: vi.fn(),
}));

vi.mock("@/lib/vendor-api", () => mocks);
vi.mock("@/app/vendor/page", () => ({
  VendorDataError: ({ error }: { error: unknown }) => (
    <div>
      <h1>Vendor workspace unavailable</h1>
      <p>{error instanceof Error ? error.message : "Please retry shortly."}</p>
    </div>
  ),
}));

import VendorEarningsPage from "@/app/vendor/earnings/page";

describe("VendorEarningsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getVendorEarnings.mockResolvedValue({
      total: 125,
      transactions: [],
    });
    mocks.getVendorWallet.mockResolvedValue({
      wallet: {
        vendor_id: "vendor-1",
        available_balance: 80,
        pending_balance: 45,
        lifetime_earnings: 500,
        total_orders: 4,
      },
    });
    mocks.getVendorPayouts.mockResolvedValue({ payouts: [] });
  });

  it("renders the settlement read models when the backend returns them", async () => {
    mocks.getVendorPayouts.mockResolvedValue({
      payouts: [
        {
          id: "payout-1",
          total_amount: 220,
          status: "paid",
          created_at: "2026-08-17T08:00:00.000Z",
          paid_at: "2026-08-18T08:00:00.000Z",
        },
      ],
    });

    render(await VendorEarningsPage());

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("Lifetime earnings")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText(/220[,.]00/)).toBeInTheDocument();
    expect(
      screen.queryByText(/temporarily unavailable/i),
    ).not.toBeInTheDocument();
  });

  it("keeps valid earnings visible when wallet and payout routes are shadowed", async () => {
    const shadowedRouteError = new Error("Vendor not found");
    mocks.getVendorWallet.mockRejectedValue(shadowedRouteError);
    mocks.getVendorPayouts.mockRejectedValue(shadowedRouteError);
    mocks.getVendorEarnings.mockResolvedValue({
      total: 125,
      transactions: [
        {
          id: "payment-1",
          vendor_payout: 125,
          paid_at: "2026-08-18T08:00:00.000Z",
          created_at: "2026-08-18T08:00:00.000Z",
          orders: { order_number: "SP-1001" },
        },
      ],
    });

    render(await VendorEarningsPage());

    expect(
      screen.queryByText("Vendor workspace unavailable"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("This month's reported earnings"),
    ).toBeInTheDocument();
    expect(screen.getByText("Completed payment history")).toBeInTheDocument();
    expect(screen.getByText("#SP-1001")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Live balance and payout history are temporarily unavailable/i,
      ),
    ).toBeInTheDocument();
  });

  it("still renders the page-level error when canonical earnings fail", async () => {
    mocks.getVendorEarnings.mockRejectedValue(new Error("API unavailable"));

    render(await VendorEarningsPage());

    expect(
      screen.getByText("Vendor workspace unavailable"),
    ).toBeInTheDocument();
    expect(screen.getByText("API unavailable")).toBeInTheDocument();
  });
});
