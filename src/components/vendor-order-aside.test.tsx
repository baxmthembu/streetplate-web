import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartProvider } from "@/components/cart-provider";
import { VendorOrderAside } from "@/components/vendor-order-aside";
import { formatRand } from "@/lib/format";
import type { Meal } from "@/lib/site-data";

const meal: Meal = {
  id: "meal-1",
  vendorId: "vendor-1",
  vendorSlug: "nandi-s",
  vendorName: "Nandi's",
  name: "Chicken plate",
  description: "Chicken, pap and chakalaka",
  price: 80,
  category: "Plate",
  accent: "coral",
  imageUrl: null,
  symbol: "C",
};

function expectSubtotal(amount: number) {
  expect(screen.getByLabelText("Order subtotal")).toHaveTextContent(
    formatRand(amount).replace(/\u00a0/g, " "),
  );
}

describe("VendorOrderAside", () => {
  beforeEach(() => window.localStorage.clear());

  it("updates the quantity and subtotal with plus and minus controls", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCartButton meal={meal} />
        <VendorOrderAside vendorId={meal.vendorId} />
      </CartProvider>,
    );

    await waitFor(() =>
      expect(screen.queryByText("Loading your cart…")).toBeNull(),
    );
    await user.click(
      screen.getByRole("button", { name: `Add ${meal.name} to cart` }),
    );
    expectSubtotal(80);

    await user.click(
      screen.getByRole("button", { name: `Increase ${meal.name} quantity` }),
    );
    expectSubtotal(160);

    await user.click(
      screen.getByRole("button", { name: `Decrease ${meal.name} quantity` }),
    );
    expectSubtotal(80);

    await user.click(
      screen.getByRole("button", { name: `Decrease ${meal.name} quantity` }),
    );
    expectSubtotal(0);
  });
});
