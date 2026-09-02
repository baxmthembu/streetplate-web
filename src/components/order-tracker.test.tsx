import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerOrder } from "@/lib/commerce-types";

import { OrderTracker } from "./order-tracker";

vi.mock("@/app/account/actions", () => ({
  cancelOrder: vi.fn(),
  submitReview: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => null,
}));

vi.mock("socket.io-client", () => ({
  io: vi.fn(),
}));

const order: CustomerOrder = {
  id: "6e411109-3c0f-4ac9-b94a-b1a11d886909",
  customer_id: "customer-1",
  vendor_id: "vendor-1",
  subtotal: 125,
  delivery_fee: 20,
  total: 145,
  status: "confirmed",
  delivery_address: "Soweto, Johannesburg",
  created_at: "2026-08-11T08:00:00.000Z",
  order_items: [
    {
      id: "item-1",
      menu_item_id: "menu-item-1",
      name: "Kota",
      quantity: 1,
      price: 125,
    },
  ],
  vendors: {
    id: "vendor-1",
    business_name: "Nandi's",
  },
};

describe("OrderTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps the last order visible when a polling request cannot connect", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(<OrderTracker initialOrder={order} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(fetchMock).toHaveBeenCalledWith(`/api/orders/${order.id}`, {
      cache: "no-store",
    });
    expect(
      screen.getByRole("heading", { name: "Payment confirmed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Live refresh is temporarily unavailable. StreetPlate will retry automatically.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Secure refresh")).toBeInTheDocument();
  });
});
