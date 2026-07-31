export type CustomerProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "vendor" | "driver" | "admin";
  avatar_url?: string | null;
};

export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  price: number | string;
  notes?: string | null;
};

export type CustomerOrder = {
  id: string;
  order_number?: string | null;
  customer_id: string;
  vendor_id: string;
  driver_id?: string | null;
  subtotal: number | string;
  delivery_fee: number | string;
  tip_amount?: number | string | null;
  total: number | string;
  status: OrderStatus;
  delivery_address: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  special_instructions?: string | null;
  created_at: string;
  vendor_reviewed?: boolean;
  driver_reviewed?: boolean;
  order_items: OrderItem[];
  vendors?: {
    id?: string;
    business_name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    cover_image?: string | null;
  } | null;
  driver?: {
    id: string;
    name: string;
    phone?: string | null;
    avatar_url?: string | null;
    location?: {
      latitude: number;
      longitude: number;
      heading?: number | null;
      speed?: number | null;
      updated_at?: string | null;
    } | null;
  } | null;
  payment?: {
    status: "pending" | "completed" | "failed" | "refunded";
    amount: number | string;
    paid_at?: string | null;
  } | null;
};

export const orderStatusCopy: Record<
  OrderStatus,
  { label: string; detail: string }
> = {
  pending: {
    label: "Awaiting payment",
    detail: "Complete payment to send the order to the vendor.",
  },
  confirmed: {
    label: "Payment confirmed",
    detail: "The vendor has received your paid order.",
  },
  preparing: {
    label: "Preparing",
    detail: "Your meal is being prepared.",
  },
  ready_for_pickup: {
    label: "Ready for pickup",
    detail: "Your order is ready for a delivery partner.",
  },
  picked_up: {
    label: "Picked up",
    detail: "The driver has collected your order.",
  },
  on_the_way: {
    label: "On the way",
    detail: "Your driver is heading to the delivery address.",
  },
  delivered: {
    label: "Delivered",
    detail: "Your order has been delivered.",
  },
  cancelled: {
    label: "Cancelled",
    detail: "This order was cancelled.",
  },
};
