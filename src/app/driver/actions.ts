"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { StreetPlateApiError, streetPlateApi } from "@/lib/backend";
import { driverTransitions, type DriverOrderStatus } from "@/lib/driver-types";

export type DriverActionState = {
  message: string;
  success?: boolean;
  field?: string;
};

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
const driverStatusSchema = z.enum([
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "picked_up",
  "on_the_way",
  "delivered",
  "cancelled",
]);

function actionError(error: unknown, fallback: string): DriverActionState {
  if (error instanceof StreetPlateApiError) {
    if (error.status === 401)
      return { message: "Your session expired. Sign in again." };
    if (error.status === 403)
      return { message: "Your driver account cannot perform this action." };
    if (error.status === 404)
      return { message: "This delivery record could not be found." };
    if (error.status === 409)
      return { message: "This information changed. Refresh and try again." };
    if (error.status === 400) return { message: fallback };
    if (error.status >= 500)
      return {
        message:
          "The driver service is temporarily unavailable. Retry shortly.",
      };
  }
  return { message: fallback };
}

export async function updateDriverAvailability(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({
      is_online: z
        .enum(["true", "false"])
        .transform((value) => value === "true"),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
    })
    .safeParse({
      is_online: formData.get("is_online"),
      latitude: formData.get("latitude") || undefined,
      longitude: formData.get("longitude") || undefined,
    });
  if (
    !parsed.success ||
    (parsed.data.is_online &&
      (parsed.data.latitude == null || parsed.data.longitude == null))
  ) {
    return { message: "Allow precise location access before going online." };
  }
  try {
    await streetPlateApi("/drivers/status", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/driver");
    return {
      success: true,
      message: parsed.data.is_online
        ? "You are online and can receive delivery offers."
        : "You are offline.",
    };
  } catch (error) {
    return actionError(error, "Your availability could not be updated.");
  }
}

export async function respondToDriverOffer(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({ offerId: z.uuid(), response: z.enum(["accept", "reject"]) })
    .safeParse({
      offerId: formData.get("offerId"),
      response: formData.get("response"),
    });
  if (!parsed.success) return { message: "This delivery offer is invalid." };
  try {
    await streetPlateApi(
      `/drivers/offers/${parsed.data.offerId}/${parsed.data.response}`,
      { method: "POST" },
    );
    revalidatePath("/driver");
    return {
      success: true,
      message:
        parsed.data.response === "accept"
          ? "Delivery accepted."
          : "Delivery declined.",
    };
  } catch (error) {
    return actionError(
      error,
      "This delivery offer may have expired or been accepted already.",
    );
  }
}

export async function advanceDeliveryStatus(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({ orderId: z.uuid(), currentStatus: driverStatusSchema })
    .safeParse({
      orderId: formData.get("orderId"),
      currentStatus: formData.get("currentStatus"),
    });
  if (!parsed.success)
    return { message: "This delivery could not be updated." };
  const nextStatus =
    driverTransitions[parsed.data.currentStatus as DriverOrderStatus];
  if (!nextStatus)
    return { message: "This delivery has no available driver action." };
  try {
    await streetPlateApi(`/orders/${parsed.data.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    revalidatePath("/driver");
    revalidatePath(`/driver/deliveries/${parsed.data.orderId}`);
    return {
      success: true,
      message: `Delivery updated to ${nextStatus.replaceAll("_", " ")}.`,
    };
  } catch (error) {
    return actionError(
      error,
      "The delivery status could not be changed from its current state.",
    );
  }
}

export async function updateDriverVehicle(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({
      vehicle_type: z.enum(["car", "motorbike"]),
      plate_number: z
        .string()
        .trim()
        .max(20)
        .regex(/^[A-Za-z0-9 -]*$/),
    })
    .safeParse({
      vehicle_type: formData.get("vehicle_type"),
      plate_number: formData.get("plate_number"),
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "vehicle_type"
          ? "Choose car or motorbike as the vehicle type."
          : "Keep the registration number under 20 characters.",
      field,
    };
  }
  try {
    await streetPlateApi("/drivers/vehicle", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/driver/profile");
    return { success: true, message: "Vehicle details saved." };
  } catch (error) {
    return actionError(error, "Your vehicle details could not be saved.");
  }
}

export async function updateDriverBankDetails(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({
      bank_name: safeSingleLine(2, 100),
      account_holder: safeSingleLine(2, 255),
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
    .safeParse({
      bank_name: formData.get("bank_name"),
      account_holder: formData.get("account_holder"),
      account_number: formData.get("account_number"),
      branch_code: formData.get("branch_code"),
      account_type: formData.get("account_type"),
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const messages: Record<string, string> = {
      bank_name: "Enter the bank name using at least 2 characters.",
      account_holder: "Enter the account holder's full name.",
      account_number: "Enter a valid account number using digits only.",
      branch_code: "Enter a valid branch code using digits only.",
      account_type: "Choose savings, cheque or current as the account type.",
    };
    return {
      message: messages[field] ?? "Check every bank detail and try again.",
      field,
    };
  }
  try {
    await streetPlateApi("/drivers/bank-details", {
      method: "PATCH",
      body: JSON.stringify(parsed.data),
    });
    revalidatePath("/driver/profile");
    revalidatePath("/driver/wallet");
    return { success: true, message: "Payout details saved securely." };
  } catch (error) {
    return actionError(error, "Your payout details could not be saved.");
  }
}

export async function sendDriverMessage(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z
    .object({ orderId: z.uuid(), content: safeMultiline(1, 1000) })
    .safeParse({
      orderId: formData.get("orderId"),
      content: formData.get("content"),
    });
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return {
      message:
        field === "content"
          ? "Write a message between 1 and 1,000 characters."
          : "This conversation could not be identified.",
      field,
    };
  }
  try {
    await streetPlateApi("/messages", {
      method: "POST",
      body: JSON.stringify({
        order_id: parsed.data.orderId,
        content: parsed.data.content,
        message_type: "text",
        sender_role: "driver",
      }),
    });
    revalidatePath(`/driver/deliveries/${parsed.data.orderId}/chat`);
    return { success: true, message: "Message sent." };
  } catch (error) {
    return actionError(
      error,
      "The message could not be sent. Confirm the delivery is still active.",
    );
  }
}

export async function revokeDriverSession(
  _previousState: DriverActionState,
  formData: FormData,
): Promise<DriverActionState> {
  const parsed = z.uuid().safeParse(formData.get("sessionId"));
  if (!parsed.success)
    return { message: "This session could not be identified." };
  try {
    await streetPlateApi(`/auth/sessions/${parsed.data}`, { method: "DELETE" });
    revalidatePath("/driver/profile");
    return { success: true, message: "Session signed out." };
  } catch (error) {
    return actionError(error, "That session could not be signed out.");
  }
}

export async function revokeOtherDriverSessions(
  _previousState: DriverActionState,
): Promise<DriverActionState> {
  void _previousState;
  try {
    await streetPlateApi("/auth/sessions", { method: "DELETE" });
    revalidatePath("/driver/profile");
    return { success: true, message: "All other sessions were signed out." };
  } catch (error) {
    return actionError(error, "Other sessions could not be signed out.");
  }
}
