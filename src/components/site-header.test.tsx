import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

vi.mock("@/app/auth/actions", () => ({ signOut: vi.fn() }));
vi.mock("./brand", () => ({
  Brand: () => <span>StreetPlate</span>,
}));
vi.mock("./cart-link", () => ({
  CartLink: () => <span>Cart</span>,
}));

describe("SiteHeader", () => {
  it("shows authentication calls to action to signed-out visitors", () => {
    render(<SiteHeader isSignedIn={false} />);

    const accountNavigation = within(
      screen.getByRole("navigation", { name: "Account navigation" }),
    );
    expect(
      accountNavigation.getByRole("link", { name: "Sign in" }),
    ).toHaveAttribute("href", "/sign-in");
    expect(
      accountNavigation.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/join");
    expect(
      accountNavigation.queryByRole("link", { name: "Account" }),
    ).not.toBeInTheDocument();
  });

  it("shows account actions to signed-in visitors", () => {
    render(<SiteHeader isSignedIn />);

    const accountNavigation = within(
      screen.getByRole("navigation", { name: "Account navigation" }),
    );
    expect(
      accountNavigation.getByRole("link", { name: "Account" }),
    ).toHaveAttribute("href", "/account");
    expect(
      accountNavigation.getByRole("link", { name: "Orders" }),
    ).toHaveAttribute("href", "/account#order-history");
    expect(
      accountNavigation.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      accountNavigation.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
  });
});
