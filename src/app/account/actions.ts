"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";

export type AccountActionState = { message: string; success?: boolean };

function handleActionError(error: unknown): AccountActionState {
  if (error instanceof StreetPlateApiError && error.status === 401)
    redirect("/sign-in");
  return {
    message:
      error instanceof Error ? error.message : "The change could not be saved.",
  };
}

export async function updateProfile(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().max(20),
    })
    .safeParse({
      name: formData.get("name"),
      phone: formData.get("phone") ?? "",
    });
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message ?? "Check your profile details.",
    };
  try {
    await streetPlateApi("/customers/profile", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/account");
    return { message: "Profile updated.", success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function addAddress(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({
      label: z.string().trim().min(1).max(50),
      address: z.string().trim().min(5).max(500),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      is_default: z.boolean(),
    })
    .safeParse({
      label: formData.get("label"),
      address: formData.get("address"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      is_default: formData.get("is_default") === "on",
    });
  if (!parsed.success)
    return {
      message: parsed.error.issues[0]?.message ?? "Check the address details.",
    };
  try {
    await streetPlateApi("/customers/addresses", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/account");
    return { message: "Address saved.", success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteAddress(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  try {
    await streetPlateApi(`/customers/addresses/${id.data}`, {
      method: "DELETE",
    });
    revalidatePath("/account");
  } catch (error) {
    handleActionError(error);
  }
}

export async function saveVendor(formData: FormData) {
  const vendorId = z.string().uuid().safeParse(formData.get("vendorId"));
  const path = String(formData.get("path") ?? "/account");
  if (!vendorId.success) return;
  try {
    await streetPlateApi(`/customers/favorites/vendors/${vendorId.data}`, {
      method: "POST",
    });
    revalidatePath(path.startsWith("/") ? path : "/account");
  } catch (error) {
    handleActionError(error);
  }
}

export async function removeVendor(formData: FormData) {
  const vendorId = z.string().uuid().safeParse(formData.get("vendorId"));
  if (!vendorId.success) return;
  try {
    await streetPlateApi(`/customers/favorites/vendors/${vendorId.data}`, {
      method: "DELETE",
    });
    revalidatePath("/account");
  } catch (error) {
    handleActionError(error);
  }
}

export async function cancelOrder(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = z
    .object({ orderId: z.string().uuid(), reason: z.string().trim().max(300) })
    .safeParse({
      orderId: formData.get("orderId"),
      reason: formData.get("reason") ?? "Customer cancelled",
    });
  if (!parsed.success)
    return { message: "The cancellation request is invalid." };
  try {
    await streetPlateApi(`/customers/orders/${parsed.data.orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason: parsed.data.reason }),
    });
    revalidatePath(`/orders/${parsed.data.orderId}`);
    revalidatePath("/account");
    return { message: "Order cancelled.", success: true };
  } catch (error) {
    return handleActionError(error);
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
      comment: z.string().trim().max(1000),
    })
    .safeParse({
      order_id: formData.get("orderId"),
      target_id: formData.get("targetId"),
      target_type: formData.get("targetType"),
      rating: formData.get("rating"),
      comment: formData.get("comment") ?? "",
    });
  if (!parsed.success)
    return { message: parsed.error.issues[0]?.message ?? "Check the review." };
  try {
    await streetPlateApi("/reviews", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath(`/orders/${parsed.data.order_id}`);
    return { message: "Thank you. Your review was submitted.", success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
