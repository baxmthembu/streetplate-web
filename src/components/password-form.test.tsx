import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { replace, useActionState } = vi.hoisted(() => ({
  replace: vi.fn(),
  useActionState: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useActionState,
}));

vi.mock("@/app/auth/actions", () => ({
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("@/components/turnstile-widget", () => ({
  TurnstileWidget: () => null,
}));

import { ResetPasswordForm } from "@/components/password-form";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to sign in only after the password update succeeds", async () => {
    useActionState.mockReturnValue([
      { success: true, message: "Password updated." },
      vi.fn(),
      false,
    ]);

    render(<ResetPasswordForm />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/sign-in?message=password_updated"),
    );
  });

  it("stays on the reset form when the update has not succeeded", () => {
    useActionState.mockReturnValue([{ message: "" }, vi.fn(), false]);

    render(<ResetPasswordForm />);

    expect(replace).not.toHaveBeenCalled();
  });
});
