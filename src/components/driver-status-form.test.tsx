import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DriverStatusForm } from "@/components/driver-status-form";
import type { DriverOrder } from "@/lib/driver-types";

vi.mock("@/app/driver/actions", () => ({
  advanceDeliveryStatus: vi.fn(async () => ({ message: "" })),
}));

const order: DriverOrder = {
  id: "6e411109-3c0f-4ac9-b94a-b1a11d886909",
  status: "ready_for_pickup",
  delivery_address: "62 Bhejane Road, KwaMashu",
};

describe("DriverStatusForm", () => {
  it("requires the driver to confirm arrival before collecting an order", async () => {
    const user = userEvent.setup();
    render(<DriverStatusForm order={order} />);

    const arrivalButton = screen.getByRole("button", {
      name: "Arrived at vendor",
    });
    expect(arrivalButton).toHaveAttribute("type", "button");

    await user.click(arrivalButton);

    expect(
      screen.getByRole("button", { name: "Pick up order" }),
    ).toHaveAttribute("type", "submit");
    expect(screen.getByRole("status")).toHaveTextContent("Arrival confirmed");
  });
});
