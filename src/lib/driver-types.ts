export type DriverOrderStatus =
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type DriverUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
};

export type DriverProfile = {
  user_id?: string;
  wallet_balance?: number | string | null;
  rating?: number | string | null;
  total_deliveries?: number | null;
  vehicle_type?: "car" | "motorbike" | null;
  plate_number?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  branch_code?: string | null;
  account_type?: "savings" | "cheque" | "current" | null;
  bank_details_updated_at?: string | null;
  verification_status?: string | null;
};

export type DriverLocation = {
  is_online: boolean;
  latitude?: number | null;
  longitude?: number | null;
  updated_at?: string | null;
};

export type DriverVendor = {
  business_name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type DriverOrderItem = {
  id?: string;
  name: string;
  quantity: number;
  price?: number | string | null;
};

export type DriverOrder = {
  id: string;
  order_number?: string | null;
  status: DriverOrderStatus;
  delivery_address: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  driver_payout?: number | string | null;
  tip_amount?: number | string | null;
  total?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  vendor_id?: string | null;
  vendors?: DriverVendor | null;
  order_items?: DriverOrderItem[];
};

export type DriverProfileResponse = {
  user: DriverUser;
  profile: DriverProfile;
  location: DriverLocation;
  activeOrder: DriverOrder | null;
};

export type DriverOffer = {
  offerId: string;
  orderId: string;
  vendorName: string;
  pickupAddress: string;
  deliveryAddress: string;
  vendorLat?: number | null;
  vendorLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  items?: DriverOrderItem[];
  payoutAmount?: number | null;
  distanceKm?: number | null;
  expiresAt: string;
  status?: DriverOrderStatus;
};

export type DriverEarning = {
  id: string;
  order_id: string;
  net_payout: number | string;
  tip_amount?: number | string | null;
  bonus_amount?: number | string | null;
  distance_fee?: number | string | null;
  platform_commission?: number | string | null;
  distance_km?: number | string | null;
  type?: string | null;
  status?: string | null;
  created_at: string;
};

export type DriverEarningsResponse = {
  summary: {
    total_net: number;
    total_tips: number;
    total_bonuses: number;
    total_commission: number;
    delivery_count: number;
    avg_per_delivery: number;
  };
  earnings: DriverEarning[];
  period: "daily" | "weekly" | "all";
};

export type DriverWallet = {
  driver_id?: string;
  available_balance: number | string;
  pending_balance: number | string;
  lifetime_earnings: number | string;
  total_tips: number | string;
  total_bonuses: number | string;
  total_deliveries: number;
};

export type DriverWalletResponse = {
  wallet: DriverWallet;
  currentWeek: { weekStart: string; weekEnd: string };
  nextPayoutDate: string;
};

export type DriverPayout = {
  id: string;
  week_start: string;
  week_end: string;
  total_amount: number | string;
  distance_fee_total?: number | string | null;
  tips_total?: number | string | null;
  bonuses_total?: number | string | null;
  commission_total?: number | string | null;
  delivery_count: number;
  status: string;
  bank_name?: string | null;
  account_number?: string | null;
  processed_at?: string | null;
  paid_at?: string | null;
  admin_notes?: string | null;
  created_at: string;
};

export type DriverPayoutsResponse = {
  payouts: DriverPayout[];
  offset: number;
  limit: number;
};

export type DriverSession = {
  id: string;
  device_info: string;
  ip_address?: string | null;
  created_at: string;
  last_seen_at: string;
  is_current: boolean;
};

export type DriverHistoryOrder = DriverOrder & {
  review?: { rating: number; comment?: string | null } | null;
  earnings?: {
    net_payout?: number | string | null;
    distance_km?: number | string | null;
    distance_fee?: number | string | null;
    tip_amount?: number | string | null;
    bonus_amount?: number | string | null;
    platform_commission?: number | string | null;
  } | null;
};

export type DriverMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  message_type?: string | null;
  is_read?: boolean | null;
  created_at: string;
  users?: { name?: string | null } | null;
};

export const driverTransitions: Partial<
  Record<DriverOrderStatus, DriverOrderStatus>
> = {
  confirmed: "picked_up",
  ready_for_pickup: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered",
};

export const driverStatusAction: Partial<Record<DriverOrderStatus, string>> = {
  confirmed: "Confirm pickup",
  ready_for_pickup: "Confirm pickup",
  picked_up: "Start delivery",
  on_the_way: "Mark delivered",
};
