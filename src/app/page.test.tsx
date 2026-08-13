import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/streetplate-api", () => ({
  getMarketplace: vi.fn().mockResolvedValue({
    vendors: [],
    meals: [],
    isDemo: false,
  }),
}));
vi.mock("@/components/current-location-button", () => ({
  CurrentLocationButton: () => <button>Use my current location</button>,
}));
vi.mock("@/components/newsletter-form", () => ({
  NewsletterForm: () => <form aria-label="Newsletter" />,
}));
vi.mock("@/components/demo-notice", () => ({ DemoNotice: () => null }));
vi.mock("@/components/meal-card", () => ({ MealCard: () => null }));
vi.mock("@/components/vendor-card", () => ({ VendorCard: () => null }));

import Home from "@/app/page";

describe("Home", () => {
  it("sends saved-address users through sign-in and back to their account", async () => {
    render(await Home());

    expect(
      screen.getByRole("link", { name: "Sign in for saved addresses" }),
    ).toHaveAttribute("href", "/sign-in?next=%2Faccount");
  });
});
