import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DriverDataState } from "./driver-data-state";

describe("DriverDataState", () => {
  it("distinguishes an active API failure from a paused deployment", () => {
    render(<DriverDataState error={{ message: "paused", status: 503 }} />);
    expect(
      screen.getByRole("heading", {
        name: /railway is online, but driver data could not be loaded/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute(
      "href",
      "/driver",
    );
  });

  it("explains when the live deployment is missing a driver endpoint", () => {
    render(<DriverDataState error={{ message: "Not found", status: 404 }} />);
    expect(
      screen.getByRole("heading", { name: /missing from the live api/i }),
    ).toBeInTheDocument();
  });

  it("sends a non-driver account back through the protected sign-in flow", () => {
    render(<DriverDataState error={{ message: "forbidden", status: 403 }} />);
    expect(
      screen.getByRole("heading", { name: /not a driver account/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      "/sign-in?next=/driver",
    );
  });
});
