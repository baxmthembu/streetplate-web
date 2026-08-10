import { describe, expect, it } from "vitest";

import { registrationConflict, signInFailure } from "@/lib/auth-error-messages";

describe("auth error messages", () => {
  it("keeps invalid credentials enumeration-safe", () => {
    expect(signInFailure("invalid_credentials")).toEqual({
      message: "The email address or password is incorrect.",
    });
  });

  it("identifies an unconfirmed account", () => {
    expect(signInFailure("email_not_confirmed")).toEqual({
      message: "Confirm your email address before signing in.",
      field: "email",
    });
  });

  it("maps duplicate email and phone codes to their fields", () => {
    expect(
      registrationConflict({
        code: "EMAIL_EXISTS",
        message: "Email address already exists",
        status: 409,
      }),
    ).toMatchObject({ field: "email" });
    expect(
      registrationConflict({
        code: "PHONE_EXISTS",
        message: "Phone number already exists",
        status: 409,
      }),
    ).toMatchObject({ field: "phone" });
  });

  it("distinguishes an incomplete confirmed profile from a duplicate email", () => {
    expect(
      registrationConflict({
        code: "PROFILE_INCOMPLETE",
        message: "Profile incomplete",
        status: 409,
      }),
    ).toMatchObject({ field: "email" });
    expect(
      registrationConflict({
        message: "Conflict",
        status: 409,
      }),
    ).toBeNull();
  });
});
