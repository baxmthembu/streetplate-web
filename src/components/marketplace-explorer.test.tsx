import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MarketplaceExplorer } from "@/components/marketplace-explorer";
import type { Meal, Vendor } from "@/lib/site-data";

const vendors: Vendor[] = [
  {
    id: "vendor-cake",
    slug: "nandi-s",
    name: "Nandi's",
    description: "Fresh local baking",
    category: "Local food",
    neighbourhood: "Soweto",
    rating: 4.8,
    reviewCount: 12,
    deliveryFee: 15,
    eta: [25, 40],
    isOpen: true,
    accent: "coral",
  },
  {
    id: "vendor-kota",
    slug: "mama-joy-s",
    name: "Mama Joy's",
    description: "Township favourites",
    category: "Kotas",
    neighbourhood: "Soweto",
    rating: 4.6,
    reviewCount: 8,
    deliveryFee: 28,
    eta: [40, 55],
    isOpen: true,
    accent: "gold",
  },
];

const meals: Meal[] = [
  {
    id: "cake",
    vendorId: "vendor-cake",
    vendorSlug: "nandi-s",
    vendorName: "Nandi's",
    name: "Cakes and alcohol",
    description: "Freshly baked cakes",
    category: "Menu",
    price: 125,
    accent: "coral",
    symbol: "C",
    imageUrl: "/food/join-township-malva.png",
  },
  {
    id: "kota",
    vendorId: "vendor-kota",
    vendorSlug: "mama-joy-s",
    vendorName: "Mama Joy's",
    name: "Special Kota",
    description: "Chips, egg and atchar",
    category: "Kotas",
    price: 65,
    accent: "gold",
    symbol: "K",
    imageUrl: "/food/kota.png",
  },
];

describe("MarketplaceExplorer food types", () => {
  it("shows vendors whose live menus match the selected food type", async () => {
    const user = userEvent.setup();
    render(<MarketplaceExplorer vendors={vendors} meals={meals} />);

    expect(screen.getByRole("heading", { name: "Nandi's" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Mama Joy's" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Bakery & dessert" }));

    expect(screen.getByRole("heading", { name: "Nandi's" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Mama Joy's" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1 vendor" })).toBeVisible();
  });

  it("filters by delivery preferences and resets all active filters", async () => {
    const user = userEvent.setup();
    render(<MarketplaceExplorer vendors={vendors} meals={meals} />);

    expect(
      screen.queryByPlaceholderText("Search vendors or meals"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Up to R20" }));

    expect(screen.getByRole("heading", { name: "Nandi's" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Mama Joy's" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("1 active filters")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Reset filters" }));

    expect(screen.getByRole("heading", { name: "Nandi's" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Mama Joy's" })).toBeVisible();
    expect(screen.queryByLabelText("1 active filters")).not.toBeInTheDocument();
  });

  it("applies a food category from the discover URL on first render", () => {
    render(
      <MarketplaceExplorer
        vendors={vendors}
        meals={meals}
        initialCategory="Kota"
      />,
    );

    expect(screen.getByRole("button", { name: "Kotas" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Mama Joy's" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Nandi's" }),
    ).not.toBeInTheDocument();
  });
});
