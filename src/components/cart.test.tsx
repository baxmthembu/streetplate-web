import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { Cart } from "@/components/cart";
import { CartProvider } from "@/components/cart-provider";
import type { Meal } from "@/lib/site-data";

const meal: Meal = {
  id: "meal-1",
  vendorId: "vendor-1",
  vendorSlug: "nandi-s",
  vendorName: "Nandi's",
  name: "Cakes and alcohol",
  description: "Delicious cakes and fine alcohol",
  category: "Dessert",
  price: 125,
  accent: "coral",
  symbol: "C",
  imageUrl: "/food/grilled-chicken.png",
};

describe("Cart", () => {
  beforeEach(() => window.localStorage.clear());

  it("shows the menu item image and editable special instructions", async () => {
    const user = userEvent.setup();
    render(
      <CartProvider>
        <AddToCartButton meal={meal} />
        <Cart />
      </CartProvider>,
    );

    await waitFor(() =>
      expect(
        screen.queryByText("Browse nearby vendors and add a meal to begin."),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: `Add ${meal.name} to cart` }),
    );

    const image = screen.getByRole("img", {
      name: `${meal.name} from ${meal.vendorName}`,
    });
    expect(image.getAttribute("src")).toContain("grilled-chicken");

    const instructions = screen.getByRole("textbox", {
      name: "Special instructions",
    });
    await user.type(instructions, "No atchar");
    expect(instructions).toHaveValue("No atchar");
  });

  it("uses the live menu image for an older saved cart item", async () => {
    window.localStorage.setItem(
      "streetplate-cart:v1",
      JSON.stringify([
        {
          id: meal.id,
          vendorId: meal.vendorId,
          vendorSlug: meal.vendorSlug,
          vendorName: meal.vendorName,
          name: meal.name,
          description: meal.description,
          price: meal.price,
          quantity: 1,
          notes: "",
        },
      ]),
    );

    render(
      <CartProvider>
        <Cart menuItems={[meal]} />
      </CartProvider>,
    );

    const image = await screen.findByRole("img", {
      name: `${meal.name} from ${meal.vendorName}`,
    });
    expect(image.getAttribute("src")).toContain("grilled-chicken");
  });
});
