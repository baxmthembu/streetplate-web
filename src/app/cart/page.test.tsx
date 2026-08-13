import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMarketplace = vi.hoisted(() => vi.fn());

vi.mock("@/lib/streetplate-api", () => ({ getMarketplace }));
vi.mock("@/components/cart", () => ({
  Cart: () => <div>Your cart items</div>,
}));
vi.mock("@/components/demo-notice", () => ({
  DemoNotice: () => <aside>Preview content</aside>,
}));

import CartPage from "@/app/cart/page";

describe("CartPage preview notice", () => {
  beforeEach(() => getMarketplace.mockReset());

  it("does not label live marketplace items as preview content", async () => {
    getMarketplace.mockResolvedValue({ meals: [], isDemo: false });

    render(await CartPage());

    expect(screen.queryByText("Preview content")).not.toBeInTheDocument();
  });

  it("retains the notice for genuine design fixtures", async () => {
    getMarketplace.mockResolvedValue({ meals: [], isDemo: true });

    render(await CartPage());

    expect(screen.getByText("Preview content")).toBeVisible();
  });
});
