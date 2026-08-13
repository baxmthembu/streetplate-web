"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import { vendorTransitions } from "@/lib/vendor-types";
import type { OrderStatus } from "@/lib/commerce-types";
import { validateImageUpload } from "@/app/vendor/upload-validation";

export type VendorActionState = {
  message: string;
  success?: boolean;
  field?: string;
};

function fail(error: unknown, fallback: string): VendorActionState {
  if (error instanceof StreetPlateApiError) {
    if (error.status === 401)
      return { message: "Your session expired. Sign in again." };
    if (error.status === 403)
      return { message: "Your vendor account cannot perform this action." };
    if (error.status === 404)
      return { message: "That vendor record could not be found." };
    if (error.status === 409)
      return { message: "That information changed. Refresh and try again." };
    if (error.status === 400) return { message: fallback };
    if (error.status >= 500)
      return {
        message:
          "The vendor service is temporarily unavailable. Retry shortly.",
      };
  }
  return { message: fallback };
}

export async function updateVendorAvailability(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z.enum(["true", "false"]).safeParse(data.get("is_open"));
  if (!parsed.success)
    return { message: "Choose whether your store is open or closed." };
  try {
    await streetPlateApi("/vendors/status", {
      method: "PATCH",
      body: JSON.stringify({ is_open: parsed.data === "true" }),
    });
    revalidatePath("/vendor");
    return {
      success: true,
      message:
        parsed.data === "true"
          ? "Your store is open for orders."
          : "Your store is closed.",
    };
  } catch (error) {
    return fail(error, "Your store availability could not be updated.");
  }
}

export async function updateVendorOrderStatus(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const orderStatusSchema = z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "picked_up",
    "on_the_way",
    "delivered",
    "cancelled",
  ]);
  const parsed = z
    .object({
      orderId: z.uuid(),
      currentStatus: orderStatusSchema,
      status: orderStatusSchema,
      cancel_reason: safeMultiline(0, 500).optional(),
    })
    .safeParse({
      orderId: data.get("orderId"),
      currentStatus: data.get("currentStatus"),
      status: data.get("status"),
      cancel_reason: data.get("cancel_reason") || undefined,
    });
  if (!parsed.success)
    return { message: "Choose a valid next step for this order." };
  const allowed =
    vendorTransitions[parsed.data.currentStatus as OrderStatus] ?? [];
  if (!allowed.includes(parsed.data.status as OrderStatus))
    return { message: "That order status change is not permitted." };
  if (parsed.data.status === "cancelled" && !parsed.data.cancel_reason)
    return {
      message: "Give the customer a reason for cancelling this order.",
      field: "cancel_reason",
    };
  try {
    await streetPlateApi(`/orders/${parsed.data.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: parsed.data.status,
        cancel_reason: parsed.data.cancel_reason,
      }),
    });
    revalidatePath("/vendor");
    revalidatePath("/vendor/orders");
    revalidatePath(`/vendor/orders/${parsed.data.orderId}`);
    return {
      success: true,
      message: `Order updated to ${parsed.data.status.replaceAll("_", " ")}.`,
    };
  } catch (error) {
    return fail(error, "The order status could not be updated.");
  }
}

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

const menuSchema = z.object({
  name: safeSingleLine(2, 255),
  description: safeMultiline(0, 1000),
  price: z.coerce.number().finite().positive().max(100000),
  category: safeSingleLine(2, 100),
  preparation_time: z.coerce.number().int().min(1).max(600),
  is_available: z.enum(["true", "false"]),
});

export async function saveMenuItem(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = menuSchema.safeParse(
    Object.fromEntries(
      [
        "name",
        "description",
        "price",
        "category",
        "preparation_time",
        "is_available",
      ].map((key) => [key, data.get(key)]),
    ),
  );
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const messages: Record<string, string> = {
      name: "Enter a menu item name.",
      description: "Keep the description under 1,000 characters.",
      price: "Enter a price greater than R0.",
      category: "Enter a food category.",
      preparation_time: "Enter preparation time between 1 and 600 minutes.",
      is_available: "Choose whether this item is available.",
    };
    return {
      message: messages[field] ?? "Check the menu item details.",
      field,
    };
  }
  const itemId = String(data.get("itemId") ?? "");
  if (itemId && !z.uuid().safeParse(itemId).success)
    return { message: "This menu item is invalid." };
  const body = new FormData();
  Object.entries(parsed.data).forEach(([key, value]) =>
    body.set(key, String(value)),
  );
  const image = data.get("image");
  if (image instanceof File && image.size) {
    const upload = await validateImageUpload(image);
    if (!upload.success) return { message: upload.message, field: "image" };
    body.set("images", upload.file);
  }
  try {
    await streetPlateApi(itemId ? `/vendors/menu/${itemId}` : "/vendors/menu", {
      method: itemId ? "PATCH" : "POST",
      body,
    });
    revalidatePath("/vendor");
    revalidatePath("/vendor/menu");
    return {
      success: true,
      message: itemId ? "Menu item updated." : "Menu item added.",
    };
  } catch (error) {
    return fail(error, "The menu item could not be saved.");
  }
}

export async function toggleMenuItem(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z
    .object({ itemId: z.uuid(), is_available: z.enum(["true", "false"]) })
    .safeParse({
      itemId: data.get("itemId"),
      is_available: data.get("is_available"),
    });
  if (!parsed.success)
    return { message: "This menu item could not be updated." };
  try {
    await streetPlateApi(`/vendors/menu/${parsed.data.itemId}/availability`, {
      method: "PATCH",
      body: JSON.stringify({
        is_available: parsed.data.is_available === "true",
      }),
    });
    revalidatePath("/vendor/menu");
    return { success: true, message: "Availability updated." };
  } catch (error) {
    return fail(error, "Availability could not be updated.");
  }
}

export async function deleteMenuItem(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const id = z.uuid().safeParse(data.get("itemId"));
  if (!id.success) return { message: "This menu item could not be deleted." };
  try {
    await streetPlateApi(`/vendors/menu/${id.data}`, { method: "DELETE" });
    revalidatePath("/vendor/menu");
    return { success: true, message: "Menu item deleted." };
  } catch (error) {
    return fail(error, "The menu item could not be deleted.");
  }
}

const promotionSchema = z
  .object({
    title: safeSingleLine(2, 255),
    description: safeMultiline(0, 1000),
    type: z.enum(["percentage", "fixed_amount", "bogo", "happy_hour"]),
    discount_value: z.coerce.number().finite().min(0).max(100000),
    minimum_order: z.coerce.number().finite().min(0).max(100000),
    is_active: z.enum(["true", "false"]),
  })
  .refine(
    (value) => value.type !== "percentage" || value.discount_value <= 100,
    { path: ["discount_value"] },
  );
export async function savePromotion(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = promotionSchema.safeParse(
    Object.fromEntries(
      [
        "title",
        "description",
        "type",
        "discount_value",
        "minimum_order",
        "is_active",
      ].map((key) => [key, data.get(key)]),
    ),
  );
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "discount_value"
          ? "Enter a valid discount amount."
          : field === "title"
            ? "Enter a promotion title."
            : `Check the ${field.replaceAll("_", " ")} field.`,
      field,
    };
  }
  const promotionId = String(data.get("promotionId") ?? "");
  if (promotionId && !z.uuid().safeParse(promotionId).success)
    return { message: "This promotion is invalid." };
  try {
    await streetPlateApi(
      promotionId
        ? `/vendors/promotions/${promotionId}`
        : "/vendors/promotions",
      {
        method: promotionId ? "PATCH" : "POST",
        body: JSON.stringify({
          ...parsed.data,
          is_active: parsed.data.is_active === "true",
        }),
      },
    );
    revalidatePath("/vendor/promotions");
    return {
      success: true,
      message: promotionId ? "Promotion updated." : "Promotion created.",
    };
  } catch (error) {
    return fail(error, "The promotion could not be saved.");
  }
}

export async function deletePromotion(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const id = z.uuid().safeParse(data.get("promotionId"));
  if (!id.success) return { message: "This promotion is invalid." };
  try {
    await streetPlateApi(`/vendors/promotions/${id.data}`, {
      method: "DELETE",
    });
    revalidatePath("/vendor/promotions");
    return { success: true, message: "Promotion deleted." };
  } catch (error) {
    return fail(error, "The promotion could not be deleted.");
  }
}

export async function saveCombo(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z
    .object({
      name: safeSingleLine(2, 255),
      description: safeMultiline(0, 1000),
      price: z.coerce.number().finite().positive().max(100000),
      items: z.array(z.uuid()).min(1).max(50),
      is_available: z.enum(["true", "false"]),
    })
    .safeParse({
      name: data.get("name"),
      description: data.get("description"),
      price: data.get("price"),
      items: data.getAll("items"),
      is_available: data.get("is_available"),
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "items"
          ? "Select at least one menu item for this combo."
          : `Enter a valid combo ${field.replaceAll("_", " ")}.`,
      field,
    };
  }
  const comboId = String(data.get("comboId") ?? "");
  if (comboId && !z.uuid().safeParse(comboId).success)
    return { message: "This combo is invalid." };
  const body = new FormData();
  body.set("name", parsed.data.name);
  body.set("description", parsed.data.description);
  body.set("price", String(parsed.data.price));
  body.set("is_available", parsed.data.is_available);
  body.set(
    "items",
    JSON.stringify(
      parsed.data.items.map((menu_item_id) => ({ menu_item_id, quantity: 1 })),
    ),
  );
  const image = data.get("image");
  if (image instanceof File && image.size) {
    const upload = await validateImageUpload(image);
    if (!upload.success) return { message: upload.message, field: "image" };
    body.set("image", upload.file);
  }
  try {
    await streetPlateApi(
      comboId ? `/vendors/combos/${comboId}` : "/vendors/combos",
      { method: comboId ? "PATCH" : "POST", body },
    );
    revalidatePath("/vendor/promotions");
    return {
      success: true,
      message: comboId ? "Combo updated." : "Combo created.",
    };
  } catch (error) {
    return fail(error, "The combo could not be saved.");
  }
}

export async function deleteCombo(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const id = z.uuid().safeParse(data.get("comboId"));
  if (!id.success) return { message: "This combo is invalid." };
  try {
    await streetPlateApi(`/vendors/combos/${id.data}`, { method: "DELETE" });
    revalidatePath("/vendor/promotions");
    return { success: true, message: "Combo deleted." };
  } catch (error) {
    return fail(error, "The combo could not be deleted.");
  }
}

export async function respondToVendorReview(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z
    .object({ reviewId: z.uuid(), response: safeMultiline(2, 1000) })
    .safeParse({
      reviewId: data.get("reviewId"),
      response: data.get("response"),
    });
  if (!parsed.success)
    return {
      message: "Write a response between 2 and 1,000 characters.",
      field: "response",
    };
  try {
    await streetPlateApi(`/reviews/${parsed.data.reviewId}/respond`, {
      method: "POST",
      body: JSON.stringify({ response: parsed.data.response }),
    });
    revalidatePath("/vendor/reviews");
    return { success: true, message: "Response published." };
  } catch (error) {
    return fail(error, "Your response could not be published.");
  }
}

export async function updateVendorProfile(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z
    .object({
      business_name: safeSingleLine(2, 255),
      description: safeMultiline(10, 1000),
      address: safeSingleLine(5, 500),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{9,20}$/),
      cover_image: z.url().refine((value) => {
        try {
          const url = new URL(value);
          return (
            url.protocol === "https:" &&
            (url.hostname === "res.cloudinary.com" ||
              url.hostname.endsWith(".supabase.co"))
          );
        } catch {
          return false;
        }
      }),
      is_open: z.enum(["true", "false"]),
    })
    .safeParse(
      Object.fromEntries(
        [
          "business_name",
          "description",
          "address",
          "phone",
          "cover_image",
          "is_open",
        ].map((key) => [key, data.get(key)]),
      ),
    );
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return { message: `Enter a valid ${field.replaceAll("_", " ")}.`, field };
  }
  try {
    await streetPlateApi("/vendors/profile", {
      method: "PUT",
      body: JSON.stringify({
        ...parsed.data,
        is_open: parsed.data.is_open === "true",
      }),
    });
    revalidatePath("/vendor");
    revalidatePath("/vendor/account");
    return { success: true, message: "Business profile updated." };
  } catch (error) {
    return fail(error, "Your business profile could not be updated.");
  }
}

export async function updateVendorBankDetails(
  _: VendorActionState,
  data: FormData,
): Promise<VendorActionState> {
  const parsed = z
    .object({
      bank_name: z.string().trim().min(2).max(100),
      account_holder: z.string().trim().min(2).max(255),
      account_number: z
        .string()
        .trim()
        .regex(/^\d{4,50}$/),
      branch_code: z
        .string()
        .trim()
        .regex(/^\d{3,20}$/),
      account_type: z.enum(["savings", "cheque", "current"]),
    })
    .safeParse(
      Object.fromEntries(
        [
          "bank_name",
          "account_holder",
          "account_number",
          "branch_code",
          "account_type",
        ].map((key) => [key, data.get(key)]),
      ),
    );
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return { message: `Enter a valid ${field.replaceAll("_", " ")}.`, field };
  }
  try {
    await streetPlateApi("/vendors/bank-details", {
      method: "PUT",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/vendor/account");
    revalidatePath("/vendor/earnings");
    return { success: true, message: "Payout details saved securely." };
  } catch (error) {
    return fail(error, "Your payout details could not be saved.");
  }
}
