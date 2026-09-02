export type AuthFailure = { message: string; field?: string };
export type SignInFailure = {
  message: string;
  field?: "email" | "password";
};

export function signInFailure(code?: string): SignInFailure {
  switch (code) {
    case "email_not_confirmed":
      return {
        message: "Confirm your email address before signing in.",
        field: "email",
      };
    case "invalid_credentials":
      return { message: "The email address or password is incorrect." };
    case "user_banned":
      return { message: "This account is currently disabled." };
    case "over_request_rate_limit":
      return { message: "Too many sign-in attempts. Wait a moment and retry." };
    case "captcha_failed":
      return { message: "The security check expired. Complete it again." };
    default:
      return { message: "We could not sign you in right now. Please retry." };
  }
}

export function registrationConflict(error: {
  code?: string;
  message: string;
  status: number;
}): AuthFailure | null {
  const message = error.message.toLowerCase();
  if (error.code === "PROFILE_INCOMPLETE") {
    return {
      message:
        "This confirmed account still needs a StreetPlate profile. Sign in with this email to finish setup.",
      field: "email",
    };
  }
  if (
    error.code === "PHONE_EXISTS" ||
    message.includes("phone") ||
    message.includes("telephone")
  ) {
    return {
      message:
        "This phone number already exists. Use a different phone number.",
      field: "phone",
    };
  }
  if (
    error.code === "EMAIL_EXISTS" ||
    message.includes("email already exists") ||
    message.includes("email is already registered") ||
    message.includes("account with this email")
  ) {
    return {
      message:
        "An account with this email already exists. Sign in instead or use a different email.",
      field: "email",
    };
  }
  return null;
}

export function registrationValidationFailure(
  field: string | undefined,
  role: "customer" | "vendor" | "driver",
): AuthFailure | null {
  switch (field?.toLowerCase()) {
    case "name":
    case "business_name":
      return {
        message:
          role === "vendor"
            ? "Enter your business name between 2 and 100 characters."
            : "Enter your full name between 2 and 100 characters.",
        field: "name",
      };
    case "email":
      return { message: "Enter a valid email address.", field: "email" };
    case "phone":
    case "telephone":
    case "mobile":
      return {
        message:
          "Enter a valid South African phone number, for example 071 234 5678.",
        field: "phone",
      };
    case "password":
      return {
        message:
          "Use a password with at least 8 characters, including uppercase, lowercase, a number and a symbol.",
        field: "password",
      };
    case "description":
      return {
        message: "Tell us about your food business in 1 to 1,000 characters.",
        field: "description",
      };
    case "address":
      return {
        message: "Enter your business address between 1 and 255 characters.",
        field: "address",
      };
    default:
      return null;
  }
}
