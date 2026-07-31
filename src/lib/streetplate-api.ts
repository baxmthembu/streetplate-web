import "server-only";

import { demoMeals, demoVendors, type Meal, type Vendor } from "./site-data";

type ApiVendor = {
  id: string;
  business_name: string;
  description: string | null;
  rating: number | string | null;
  total_reviews: number | null;
  is_open: boolean;
  cover_image?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_fee?: number | string | null;
  estimated_delivery_time?: number | null;
  address?: string | null;
  category_tags?: string[] | null;
  delivery_radius_km?: number | string | null;
};

type ApiMeal = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  category: string | null;
  preparation_time: number | null;
  is_available: boolean;
};

type VendorDetailResponse = {
  vendor: ApiVendor;
  menu?: ApiMeal[];
};

function apiBase(): string | null {
  const value = process.env.STREETPLATE_API_URL?.replace(/\/$/, "");
  if (!value) return null;
  return value.endsWith("/api") ? value : `${value}/api`;
}

function imageUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && typeof parsed[0] === "string")
      return parsed[0];
  } catch {}
  return value;
}

function mapVendor(vendor: ApiVendor, index: number): Vendor {
  const eta = Number(vendor.estimated_delivery_time ?? 30);
  return {
    id: vendor.id,
    slug: `${toSlug(vendor.business_name)}-${vendor.id}`,
    name: vendor.business_name,
    description: vendor.description ?? "Local food made in your community.",
    category: vendor.category_tags?.[0] ?? "Local food",
    neighbourhood: vendor.address ?? "Nearby",
    rating: Number(vendor.rating ?? 0),
    reviewCount: vendor.total_reviews ?? 0,
    deliveryFee: Number(vendor.delivery_fee ?? 15),
    eta: [eta, eta + 15],
    isOpen: vendor.is_open,
    accent: ["coral", "gold", "leaf"][index % 3],
    coverImage: vendor.cover_image ?? null,
    latitude: vendor.latitude ?? null,
    longitude: vendor.longitude ?? null,
    deliveryRadius:
      vendor.delivery_radius_km == null
        ? null
        : Number(vendor.delivery_radius_km),
  };
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function getVendors(): Promise<{
  vendors: Vendor[];
  isDemo: boolean;
}> {
  const apiUrl = apiBase();
  if (!apiUrl) return { vendors: demoVendors, isDemo: true };

  try {
    const response = await fetch(`${apiUrl}/vendors`, {
      next: { revalidate: 60 },
    });
    if (!response.ok)
      throw new Error(`Vendors request failed: ${response.status}`);

    const payload = (await response.json()) as { vendors?: ApiVendor[] };
    const vendors = (payload.vendors ?? []).map(mapVendor);

    return { vendors, isDemo: false };
  } catch {
    return { vendors: demoVendors, isDemo: true };
  }
}

export async function getVendorBySlug(
  slug: string,
): Promise<{ vendor: Vendor | null; meals: Meal[]; isDemo: boolean }> {
  const { vendors, isDemo } = await getVendors();
  const vendor = vendors.find((item) => item.slug === slug) ?? null;

  if (vendor && !isDemo) {
    const apiUrl = apiBase();
    if (!apiUrl) return { vendor, meals: [], isDemo: false };
    try {
      const response = await fetch(`${apiUrl}/vendors/${vendor.id}`, {
        next: { revalidate: 60 },
      });
      if (!response.ok) throw new Error("Vendor details unavailable");
      const payload = (await response.json()) as VendorDetailResponse;
      const safeVendor = mapVendor(payload.vendor, 0);
      const meals = (payload.menu ?? []).map((meal, index): Meal => ({
        id: meal.id,
        vendorId: vendor.id,
        vendorSlug: vendor.slug,
        vendorName: safeVendor.name,
        name: meal.name,
        description: meal.description ?? "Prepared fresh by this vendor.",
        category: meal.category ?? "Menu",
        price: Number(meal.price),
        accent: ["coral", "gold", "leaf", "sky"][index % 4],
        symbol: meal.name.slice(0, 1).toUpperCase(),
        imageUrl: imageUrl(meal.image_url),
        preparationTime: meal.preparation_time ?? 15,
        isAvailable: meal.is_available,
      }));
      return { vendor: safeVendor, meals, isDemo: false };
    } catch {
      return { vendor, meals: [], isDemo: false };
    }
  }

  return {
    vendor,
    meals: isDemo ? demoMeals.filter((meal) => meal.vendorSlug === slug) : [],
    isDemo,
  };
}

export async function getMarketplace(): Promise<{
  vendors: Vendor[];
  meals: Meal[];
  isDemo: boolean;
}> {
  const result = await getVendors();
  if (result.isDemo) return { ...result, meals: demoMeals };
  const details = await Promise.all(
    result.vendors.map((vendor) => getVendorBySlug(vendor.slug)),
  );
  return {
    vendors: details.map(
      (detail, index) => detail.vendor ?? result.vendors[index],
    ),
    meals: details.flatMap((detail) => detail.meals),
    isDemo: false,
  };
}
