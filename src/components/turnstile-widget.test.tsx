import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TurnstileWidget } from "@/components/turnstile-widget";

const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

describe("TurnstileWidget", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey;
    delete window.turnstile;
    vi.restoreAllMocks();
  });

  it("stores a successful challenge token and resets it after a submission", () => {
    const onVerifiedChange = vi.fn();
    const reset = vi.fn();
    window.turnstile = {
      render: vi.fn((_container, options) => {
        options.callback("verified-token");
        return "widget-id";
      }),
      remove: vi.fn(),
      reset,
    };
    const firstSignal = {};

    const { container, rerender } = render(
      <TurnstileWidget
        action="login"
        onVerifiedChange={onVerifiedChange}
        resetSignal={firstSignal}
      />,
    );

    expect(onVerifiedChange).toHaveBeenCalledWith(true);
    expect(
      screen.getByRole("group", { name: "Security verification" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      ),
    ).toHaveValue("verified-token");

    act(() => {
      rerender(
        <TurnstileWidget
          action="login"
          onVerifiedChange={onVerifiedChange}
          resetSignal={{}}
        />,
      );
    });

    expect(reset).toHaveBeenCalledWith("widget-id");
    expect(onVerifiedChange).toHaveBeenLastCalledWith(false);
  });

  it("fails closed when the site key is missing", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    render(
      <TurnstileWidget
        action="signup"
        onVerifiedChange={vi.fn()}
        resetSignal={{}}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Security verification is not configured",
    );
  });
});
