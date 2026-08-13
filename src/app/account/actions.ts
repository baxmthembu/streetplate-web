"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import { safeInternalPath } from "@/lib/auth-navigation";

export type AccountActionState = {
  message: string;
  success?: boolean;
  field?: string;
};

const requiredNumber = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number().min(minimum).max(maximum),
  );

const safeSingleLine = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !/[\u0000-\u001f\u007f]/.test(value));
const safeMultiline = (minimum: number, maximum: number) =>
  z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
    );

function handleActionError(
  error: unknown,
  fallback: string,
): AccountActionState {
  if (error instanceof StreetPlateApiError && error.status === 401)
    redirect("/sign-in");
  if (error instanceof StreetPlateApiError) {
    if (error.status === 403)
      return { message: "You do not have permission to make this change." };
    if (error.status === 404)
      return { message: "The requested information could not be found." };
    if (error.status === 409)
      return { message: "That information is already in use." };
    if (error.status === 400) return { message: fallback };
    if (error.status >= 500)
      return {
        message:
          "StreetPlate is temporarily unavailable. Please retry shortly.",
      };
  }
  return { message: fallback };
}

export async function updateProfile(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      name: safeSingleLine(2, 100),
      phone: z
        .string()
        .trim()
        .max(20)
        .refine(
          (value) => !value || /^\+?[0-9][0-9 ()-]{6,19}$/.test(value),
          "Enter a valid phone number.",
        ),
    })
    .safeParse({
      name: formData.get("name"),
      phone: formData.get("phone") ?? "",
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "name"
          ? "Enter a name between 2 and 100 characters."
          : "Enter a valid phone number.",
      field,
    };
  }
  try {
    await streetPlateApi("/customers/profile", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/account");
    return { message: "Profile updated.", success: true };
  } catch (error) {
    if (
      error instanceof StreetPlateApiError &&
      (error.status === 409 || error.message.toLowerCase().includes("phone"))
    ) {
      return {
        message: "This phone number already belongs to another account.",
        field: "phone",
      };
    }
    return handleActionError(error, "Your profile details could not be saved.");
  }
}

export async function addAddress(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      label: safeSingleLine(1, 50),
      address: safeSingleLine(5, 500),
      latitude: requiredNumber(-90, 90),
      longitude: requiredNumber(-180, 180),
      is_default: z.boolean(),
    })
    .safeParse({
      label: formData.get("label"),
      address: formData.get("address"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      is_default: formData.get("is_default") === "on",
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const messages: Record<string, string> = {
      label: "Enter an address label such as Home or Work.",
      address: "Enter a complete street address of at least 5 characters.",
      latitude: "Enter a valid latitude between -90 and 90.",
      longitude: "Enter a valid longitude between -180 and 180.",
    };
    return {
      message: messages[field] ?? "Check the address details.",
      field,
    };
  }
  try {
    await streetPlateApi("/customers/addresses", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/account");
    return { message: "Address saved.", success: true };
  } catch (error) {
    return handleActionError(error, "The address details could not be saved.");
  }
}

export async function deleteAddress(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { message: "The address could not be removed." };
  try {
    await streetPlateApi(`/customers/addresses/${id.data}`, {
      method: "DELETE",
    });
    revalidatePath("/account");
    return { message: "Address removed.", success: true };
  } catch (error) {
    return handleActionError(error, "This address could not be removed.");
  }
}

export async function saveVendor(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const vendorId = z.string().uuid().safeParse(formData.get("vendorId"));
  const pathInput = z
    .string()
    .max(500)
    .safeParse(formData.get("path") ?? "/account");
  const path = pathInput.success ? pathInput.data : "/account";
  if (!vendorId.success) return { message: "The vendor could not be saved." };
  try {
    await streetPlateApi(`/customers/favorites/vendors/${vendorId.data}`, {
      method: "POST",
    });
    revalidatePath(safeInternalPath(path, "/account"));
    return { message: "Vendor saved.", success: true };
  } catch (error) {
    return handleActionError(error, "This vendor could not be saved.");
  }
}

export async function removeVendor(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const vendorId = z.string().uuid().safeParse(formData.get("vendorId"));
  if (!vendorId.success) return { message: "The vendor could not be removed." };
  try {
    await streetPlateApi(`/customers/favorites/vendors/${vendorId.data}`, {
      method: "DELETE",
    });
    revalidatePath("/account");
    return { message: "Vendor removed.", success: true };
  } catch (error) {
    return handleActionError(error, "This vendor could not be removed.");
  }
}

export async function cancelOrder(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      orderId: z.string().uuid(),
      reason: safeMultiline(3, 300),
    })
    .safeParse({
      orderId: formData.get("orderId"),
      reason: formData.get("reason") ?? "Customer cancelled",
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "reason"
          ? "Enter a cancellation reason between 3 and 300 characters."
          : "This order could not be identified.",
      field,
    };
  }
  try {
    await streetPlateApi(`/customers/orders/${parsed.data.orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: parsed.data.reason }),
    });
    revalidatePath(`/orders/${parsed.data.orderId}`);
    revalidatePath("/account");
    return { message: "Order cancelled.", success: true };
  } catch (error) {
    return handleActionError(
      error,
      "This order can no longer be cancelled. Refresh to see its latest status.",
    );
  }
}

export async function submitReview(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      order_id: z.string().uuid(),
      target_id: z.string().uuid(),
      target_type: z.enum(["vendor", "driver"]),
      rating: z.coerce.number().int().min(1).max(5),
      comment: safeMultiline(0, 1000),
    })
    .safeParse({
      order_id: formData.get("orderId"),
      target_id: formData.get("targetId"),
      target_type: formData.get("targetType"),
      rating: formData.get("rating"),
      comment: formData.get("comment") ?? "",
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "rating"
          ? "Choose a rating from 1 to 5."
          : field === "comment"
            ? "Keep your review comment under 1,000 characters."
            : "This review could not be matched to the order.",
      field,
    };
  }
  try {
    await streetPlateApi("/reviews", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath(`/orders/${parsed.data.order_id}`);
    return { message: "Thank you. Your review was submitted.", success: true };
  } catch (error) {
    if (
      error instanceof StreetPlateApiError &&
      error.message.toLowerCase().includes("already")
    ) {
      return { message: "You have already submitted this review." };
    }
    return handleActionError(
      error,
      "The review could not be submitted. Confirm the order was delivered and retry.",
    );
  }
}
