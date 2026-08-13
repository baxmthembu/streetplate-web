import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileTurnstileBridge } from "@/components/mobile-turnstile-bridge";

vi.mock("@/components/turnstile-widget", () => ({
  TurnstileWidget: ({
    action,
    cData,
    onTokenChange,
  }: {
    action: string;
    cData: string;
    onTokenChange: (token: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onTokenChange("verified-mobile-token")}
    >
      {action}:{cData}
    </button>
  ),
}));

describe("MobileTurnstileBridge", () => {
  afterEach(() => {
    delete window.ReactNativeWebView;
  });

  it("sends the verified token and action to React Native", () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };

    render(<MobileTurnstileBridge action="login" app="driver" />);
    fireEvent.click(
      screen.getByRole("button", { name: "login:mobile_driver" }),
    );

    expect(postMessage).toHaveBeenCalledWith(
      JSON.stringify({
        type: "turnstile",
        status: "success",
        action: "login",
        token: "verified-mobile-token",
      }),
    );
  });
});
