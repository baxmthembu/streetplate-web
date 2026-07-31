"use server";

import { z } from "zod";

import { streetPlateApi } from "@/lib/backend";
import { distanceKm } from "@/lib/commerce-rules";
import { getVendorBySlug } from "@/lib/streetplate-api";

export type CheckoutState = {
  message: string;
  orderId?: string;
};

const cartSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(255),
      vendorId: z.string().min(1).max(255),
      vendorSlug: z.string().min(1).max(300),
      quantity: z.number().int().min(1).max(100),
      notes: z.string().max(300).optional(),
    }),
  )
  .min(1)
  .max(50);

export async function createOrder(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  let cartValue: unknown;
  try {
    cartValue = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { message: "Your cart could not be read. Refresh and try again." };
  }

  const parsed = z
    .object({
      items: cartSchema,
      address: z.string().trim().min(5).max(500),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      instructions: z.string().trim().max(500),
      tip: z.coerce.number().min(0).max(500),
      terms: z.literal("on"),
    })
    .safeParse({
      items: cartValue,
      address: formData.get("address"),
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      instructions: formData.get("instructions") ?? "",
      tip: formData.get("tip") ?? 0,
      terms: formData.get("terms"),
    });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Check the delivery details.",
    };
  }

  const vendorId = parsed.data.items[0].vendorId;
  const vendorSlug = parsed.data.items[0].vendorSlug;
  if (parsed.data.items.some((item) => item.vendorId !== vendorId)) {
    return { message: "An order can contain items from one vendor only." };
  }

  const detail = await getVendorBySlug(vendorSlug);
  if (!detail.vendor || detail.vendor.id !== vendorId || detail.isDemo) {
    return { message: "This vendor is not available for live checkout." };
  }
  if (!detail.vendor.isOpen)
    return { message: "This vendor is currently closed." };

  const menuById = new Map(detail.meals.map((meal) => [meal.id, meal]));
  if (parsed.data.items.some((item) => !menuById.has(item.id))) {
    return { message: "One or more cart items are no longer available." };
  }

  if (
    detail.vendor.latitude != null &&
    detail.vendor.longitude != null &&
    detail.vendor.deliveryRadius != null
  ) {
    const distance = distanceKm(
      detail.vendor.latitude,
      detail.vendor.longitude,
      parsed.data.latitude,
      parsed.data.longitude,
    );
    if (distance > detail.vendor.deliveryRadius) {
      return {
        message: `This address is outside the vendor's ${detail.vendor.deliveryRadius} km delivery area.`,
      };
    }
  }

  const items = parsed.data.items.map((item) => {
    const meal = menuById.get(item.id)!;
    return {
      id: meal.id,
      name: meal.name,
      quantity: item.quantity,
      price: meal.price,
      notes: item.notes || null,
    };
  });

  try {
    const payload = await streetPlateApi<{
      order: { id: string };
    }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        vendor_id: vendorId,
        items,
        delivery_address: parsed.data.address,
        delivery_latitude: parsed.data.latitude,
        delivery_longitude: parsed.data.longitude,
        special_instructions: parsed.data.instructions || undefined,
        tip_amount: parsed.data.tip,
      }),
    });
    return { message: "Order created securely.", orderId: payload.order.id };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "The order could not be created.",
    };
  }
}
