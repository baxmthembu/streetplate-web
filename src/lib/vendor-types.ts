import type {
  CustomerOrder,
  CustomerProfile,
  OrderStatus,
} from "@/lib/commerce-types";

export type VendorProfile = {
  id: string;
  user_id?: string;
  business_name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  cover_image?: string | null;
  is_open?: boolean;
  rating?: number | string | null;
  total_reviews?: number | null;
};

export type VendorMenuItem = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number | string;
  is_available?: boolean;
  preparation_time?: number | null;
  image_url?: string | null;
  images?: string[] | null;
};

export type VendorPromotion = {
  id: string;
  title: string;
  description?: string | null;
  type: "percentage" | "fixed_amount" | "bogo" | "happy_hour";
  discount_value: number | string;
  minimum_order?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};

export type VendorCombo = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  is_available?: boolean;
  image_url?: string | null;
  combo_meal_items?: Array<{
    quantity?: number;
    menu_items?: { id: string; name: string; price: number | string } | null;
  }>;
};

export type VendorAnalytics = {
  period: string;
  revenue: number;
  orderCount: number;
  activeOrders: number;
  completedOrders: number;
  avgRating: number;
  totalReviews: number;
};

export type VendorTopItem = { name: string; quantity: number; revenue: number };
export type VendorEarnings = {
  total: number;
  transactions: Array<Record<string, unknown>>;
};
export type VendorWallet = {
  vendor_id: string;
  available_balance: number | string;
  pending_balance: number | string;
  lifetime_earnings: number | string;
  total_orders: number;
};
export type VendorPayout = {
  id: string;
  amount: number | string;
  status: string;
  created_at: string;
  processed_at?: string | null;
};
export type VendorReview = {
  id: string;
  rating: number;
  comment?: string | null;
  response?: string | null;
  created_at: string;
  users?: { name?: string | null } | null;
};

export type VendorDashboardData = {
  user: CustomerProfile;
  vendor: VendorProfile;
  menu: VendorMenuItem[];
  orders: CustomerOrder[];
};

export const vendorTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
};

export const vendorStatusLabels: Record<OrderStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
