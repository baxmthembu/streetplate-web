"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import { distanceKm } from "@/lib/commerce-rules";
import { getVendorBySlug } from "@/lib/streetplate-api";
import { rateLimitClientKey } from "@/lib/security/client-ip";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type CheckoutState = {
  message: string;
  orderId?: string;
  field?: string;
};

const requiredNumber = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number().min(minimum).max(maximum),
  );

const cartSchema = z
  .array(
    z.object({
      id: z.uuid(),
      vendorId: z.uuid(),
      vendorSlug: z
        .string()
        .min(3)
        .max(300)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      quantity: z.number().int().min(1).max(100),
      notes: z
        .string()
        .trim()
        .max(300)
        .refine(
          (value) =>
            !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        )
        .optional(),
    }),
  )
  .min(1)
  .max(50);

export async function createOrder(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const requestHeaders = await headers();
  const clientKey = rateLimitClientKey(requestHeaders);
  const rateLimit = await consumeRateLimit(
    `server-action:checkout:${clientKey}`,
    {
      limit: 15,
      windowMs: 600_000,
    },
  );
  if (!rateLimit.allowed) {
    return {
      message: "Too many checkout attempts. Wait 10 minutes and try again.",
    };
  }

  let cartValue: unknown;
  try {
    cartValue = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { message: "Your cart could not be read. Refresh and try again." };
  }

  const parsed = z
    .object({
      items: cartSchema,
      address: z
        .string()
        .trim()
        .min(5)
        .max(500)
        .refine((value) => !/[\u0000-\u001f\u007f]/.test(value)),
      latitude: requiredNumber(-90, 90),
      longitude: requiredNumber(-180, 180),
      instructions: z
        .string()
        .trim()
        .max(500)
        .refine(
          (value) =>
            !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
        ),
      tip: z.coerce.number().finite().min(0).max(500),
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
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const messages: Record<string, string> = {
      items: "Your cart is empty or contains an invalid item.",
      address: "Enter a complete delivery address of at least 5 characters.",
      latitude: "Enter a valid delivery latitude between -90 and 90.",
      longitude: "Enter a valid delivery longitude between -180 and 180.",
      instructions: "Keep delivery instructions under 500 characters.",
      tip: "Enter a driver tip between R0 and R500.",
      terms: "Accept the terms and cancellation policy before ordering.",
    };
    return {
      message: messages[field] ?? "Check the delivery details.",
      field,
    };
  }

  const vendorId = parsed.data.items[0].vendorId;
  const vendorSlug = parsed.data.items[0].vendorSlug;
  if (parsed.data.items.some((item) => item.vendorId !== vendorId)) {
    return { message: "An order can contain items from one vendor only." };
  }
  if (parsed.data.items.some((item) => item.vendorSlug !== vendorSlug)) {
    return { message: "The cart contains inconsistent vendor information." };
  }

  const detail = await getVendorBySlug(vendorSlug);
  if (!detail.vendor || detail.vendor.id !== vendorId || detail.isDemo) {
    return { message: "This vendor is not available for live checkout." };
  }
  if (!detail.vendor.isOpen)
    return { message: "This vendor is currently closed." };

  const menuById = new Map(detail.meals.map((meal) => [meal.id, meal]));
  if (
    parsed.data.items.some((item) => {
      const meal = menuById.get(item.id);
      return !meal || meal.isAvailable === false;
    })
  ) {
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
    const response = z
      .object({ order: z.object({ id: z.uuid() }) })
      .safeParse(payload);
    if (!response.success) {
      return {
        message:
          "The order was received, but confirmation is delayed. Check your orders before retrying.",
      };
    }
    return {
      message: "Order created securely.",
      orderId: response.data.order.id,
    };
  } catch (error) {
    if (error instanceof StreetPlateApiError) {
      if (error.status === 401)
        return { message: "Sign in before placing your order." };
      if (error.status === 403)
        return { message: "This account cannot place customer orders." };
      if (error.status === 404)
        return {
          message:
            "A vendor or menu item in your cart is no longer available. Refresh your cart.",
        };
      if (error.status === 409)
        return {
          message:
            "Your order changed while it was being submitted. Review the cart and retry.",
        };
      if (error.status === 400)
        return {
          message:
            "The order details were rejected. Check the address, cart items and quantities.",
        };
      if (error.status >= 500)
        return {
          message:
            "Ordering is temporarily unavailable. Your cart is safe; please retry shortly.",
        };
    }
    return {
      message:
        "The order could not be created. Your cart has not been cleared.",
    };
  }
}
