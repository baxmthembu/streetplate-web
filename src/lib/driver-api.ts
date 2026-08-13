import "server-only";

import { cache } from "react";

import { streetPlateApi } from "@/lib/backend";
import type { CustomerProfile } from "@/lib/commerce-types";
import type {
  DriverEarningsResponse,
  DriverHistoryOrder,
  DriverMessage,
  DriverOrder,
  DriverPayoutsResponse,
  DriverProfileResponse,
  DriverSession,
  DriverWalletResponse,
} from "@/lib/driver-types";

export const getDriverUser = cache(() =>
  streetPlateApi<{ user: CustomerProfile }>("/auth/profile"),
);

export const getDriverProfile = cache(() =>
  streetPlateApi<DriverProfileResponse>("/drivers/profile"),
);

export function getDriverEarnings(period: "daily" | "weekly" | "all") {
  return streetPlateApi<DriverEarningsResponse>(
    `/drivers/earnings?period=${period}`,
  );
}

export function getDriverWallet() {
  return streetPlateApi<DriverWalletResponse>("/drivers/wallet");
}

export function getDriverPayouts(offset = 0, limit = 20) {
  return streetPlateApi<DriverPayoutsResponse>(
    `/drivers/payouts?offset=${offset}&limit=${limit}`,
  );
}

export function getDriverHistory(offset = 0, limit = 20) {
  return streetPlateApi<{
    orders: DriverHistoryOrder[];
    offset: number;
    limit: number;
  }>(`/drivers/history?offset=${offset}&limit=${limit}`);
}

export function getDriverOrder(orderId: string) {
  return streetPlateApi<{ order: DriverOrder }>(`/orders/${orderId}`);
}

export function getDriverMessages(orderId: string) {
  return streetPlateApi<{ messages: DriverMessage[] }>(`/messages/${orderId}`);
}

export function getDriverSessions() {
  return streetPlateApi<{ sessions: DriverSession[] }>("/auth/sessions");
}
