import { describe, expect, it } from "vitest";

import {
  registrationConflict,
  registrationValidationFailure,
  signInFailure,
} from "@/lib/auth-error-messages";

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

  it("maps backend validation paths to the matching vendor input", () => {
    expect(registrationValidationFailure("phone", "vendor")).toEqual({
      message:
        "Enter a valid South African phone number, for example 071 234 5678.",
      field: "phone",
    });
    expect(registrationValidationFailure("business_name", "vendor")).toEqual({
      message: "Enter your business name between 2 and 100 characters.",
      field: "name",
    });
    expect(registrationValidationFailure("description", "vendor")).toEqual({
      message: "Tell us about your food business in 1 to 1,000 characters.",
      field: "description",
    });
  });

  it("does not assign an internal backend field to a visible input", () => {
    expect(
      registrationValidationFailure("turnstile_token", "vendor"),
    ).toBeNull();
  });
});
