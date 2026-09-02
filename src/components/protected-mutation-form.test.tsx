import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProtectedMutationForm } from "@/components/protected-mutation-form";

const action = vi.fn(async () => ({ message: "" }));

describe("ProtectedMutationForm", () => {
  it("submits without Turnstile", () => {
    render(
      <ProtectedMutationForm
        action={action}
        buttonClassName="button"
        buttonLabel="Save vendor"
        fields={{ vendorId: "vendor-id" }}
      />,
    );

    expect(screen.getByRole("button", { name: "Save vendor" })).toBeEnabled();
  });

  it("allows address deletion without Turnstile", () => {
    render(
      <ProtectedMutationForm
        action={action}
        buttonClassName="button"
        buttonLabel="Remove"
        fields={{ id: "address-id" }}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
  });
});
