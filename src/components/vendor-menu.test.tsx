import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VendorMenu } from "@/components/vendor-menu";
import type { Meal } from "@/lib/site-data";

vi.mock("@/components/meal-card", () => ({
  MealCard: ({ meal }: { meal: Meal }) => <article>{meal.name}</article>,
}));

const meals: Meal[] = [
  {
    id: "kota",
    vendorId: "vendor",
    vendorSlug: "mama-joy",
    vendorName: "Mama Joy",
    name: "Special Kota",
    description: "Chips, egg and atchar",
    category: "Kotas",
    price: 65,
    accent: "gold",
    symbol: "K",
  },
  {
    id: "stew",
    vendorId: "vendor",
    vendorSlug: "mama-joy",
    vendorName: "Mama Joy",
    name: "Beef Stew",
    description: "Slow-cooked beef with pap",
    category: "Traditional",
    price: 90,
    accent: "coral",
    symbol: "B",
  },
];

describe("VendorMenu", () => {
  it("filters the vendor menu and announces an accessible empty state", async () => {
    const user = userEvent.setup();
    render(<VendorMenu meals={meals} />);

    const search = screen.getByRole("searchbox", { name: "Search this menu" });
    await user.type(search, "stew");

    expect(screen.getByText("Beef Stew")).toBeVisible();
    expect(screen.queryByText("Special Kota")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "pizza");

    expect(screen.getByRole("status")).toHaveTextContent(
      "No menu items match your search.",
    );
  });
});
