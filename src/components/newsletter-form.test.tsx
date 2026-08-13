import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NewsletterForm } from "@/components/newsletter-form";

describe("NewsletterForm", () => {
  it("shows a specific invalid-email message", () => {
    render(<NewsletterForm />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join the waitlist/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid email address.",
    );
  });

  it("does not pretend to store a valid email before marketing is connected", () => {
    render(<NewsletterForm />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "customer@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join the waitlist/i }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your email was not submitted or stored.",
    );
  });
});
