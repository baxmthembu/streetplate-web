import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDriverUser: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/driver-shell", () => ({
  DriverShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="driver-shell">{children}</div>
  ),
}));
vi.mock("@/lib/driver-api", () => ({ getDriverUser: mocks.getDriverUser }));
vi.mock("@/lib/backend", () => ({
  StreetPlateApiError: class StreetPlateApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
}));

import DriverLayout from "./layout";
import { StreetPlateApiError } from "@/lib/backend";

describe("DriverLayout", () => {
  beforeEach(() => {
    mocks.getDriverUser.mockReset();
    mocks.redirect.mockReset();
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    });
  });

  it("renders the portal for an authenticated driver", async () => {
    mocks.getDriverUser.mockResolvedValue({ user: { role: "driver" } });

    render(await DriverLayout({ children: <span>Driver content</span> }));

    expect(screen.getByTestId("driver-shell")).toHaveTextContent(
      "Driver content",
    );
  });

  it.each([
    ["vendor", "/vendor"],
    ["customer", "/account"],
    ["admin", "/account"],
  ])("routes a %s account away from the driver portal", async (role, path) => {
    mocks.getDriverUser.mockResolvedValue({ user: { role } });

    await expect(
      DriverLayout({ children: <span>Driver content</span> }),
    ).rejects.toThrow(`NEXT_REDIRECT:${path}`);
    expect(mocks.redirect).toHaveBeenCalledWith(path);
  });

  it("sends an expired session through the protected sign-in flow", async () => {
    mocks.getDriverUser.mockRejectedValue(
      new StreetPlateApiError("Sign in", 401),
    );

    await expect(
      DriverLayout({ children: <span>Driver content</span> }),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in?next=/driver");
    expect(mocks.redirect).toHaveBeenCalledWith("/sign-in?next=/driver");
  });
});
