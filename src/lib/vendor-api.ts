import "server-only";

import { cache } from "react";

import { streetPlateApi } from "@/lib/backend";
import type { CustomerOrder, CustomerProfile } from "@/lib/commerce-types";
import type {
  VendorAnalytics,
  VendorCombo,
  VendorEarnings,
  VendorMenuItem,
  VendorPayout,
  VendorProfile,
  VendorPromotion,
  VendorReview,
  VendorTopItem,
  VendorWallet,
} from "@/lib/vendor-types";

export const getVendorUser = cache(() =>
  streetPlateApi<{ user: CustomerProfile }>("/auth/profile"),
);
export const getVendorProfile = cache(() =>
  streetPlateApi<{ vendor: VendorProfile }>("/vendors/profile"),
);
export function getVendorOrders(query = "limit=50") {
  return streetPlateApi<{ orders: CustomerOrder[] }>(`/orders?${query}`);
}
export function getVendorOrder(id: string) {
  return streetPlateApi<{ order: CustomerOrder }>(`/orders/${id}`);
}
export function getVendorMenu() {
  return streetPlateApi<{ menu: VendorMenuItem[] }>("/vendors/menu");
}
export function getVendorPromotions() {
  return streetPlateApi<{ promotions: VendorPromotion[] }>(
    "/vendors/promotions",
  );
}
export function getVendorCombos() {
  return streetPlateApi<{ combos: VendorCombo[] }>("/vendors/combos");
}
export function getVendorAnalytics(period: "day" | "week" | "month") {
  return streetPlateApi<VendorAnalytics>(
    `/vendors/analytics/summary?period=${period}`,
  );
}
export function getVendorTopItems() {
  return streetPlateApi<{ items: VendorTopItem[] }>(
    "/vendors/analytics/top-items",
  );
}
export function getVendorEarnings(from?: string, to?: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return streetPlateApi<VendorEarnings>(`/vendors/analytics/earnings?${query}`);
}
export function getVendorWallet() {
  return streetPlateApi<{ wallet: VendorWallet }>("/vendors/wallet");
}
export function getVendorPayouts() {
  return streetPlateApi<{ payouts: VendorPayout[] }>("/vendors/payouts");
}
export function getVendorReviews() {
  return streetPlateApi<{ reviews: VendorReview[] }>("/reviews/vendors/me");
}
