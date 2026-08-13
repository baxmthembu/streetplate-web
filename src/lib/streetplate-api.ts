import "server-only";

import { demoMeals, demoVendors, type Meal, type Vendor } from "./site-data";
import { createClient } from "./supabase/server";

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

type MarketplaceResult = {
  vendors: Vendor[];
  meals: Meal[];
  isDemo: boolean;
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
    coverImage: imageUrl(vendor.cover_image ?? null),
    latitude: vendor.latitude ?? null,
    longitude: vendor.longitude ?? null,
    deliveryRadius:
      vendor.delivery_radius_km == null
        ? null
        : Number(vendor.delivery_radius_km),
  };
}

function mapMeal(meal: ApiMeal, vendor: Vendor, index: number): Meal {
  return {
    id: meal.id,
    vendorId: vendor.id,
    vendorSlug: vendor.slug,
    vendorName: vendor.name,
    name: meal.name,
    description: meal.description ?? "Prepared fresh by this vendor.",
    category: meal.category ?? "Menu",
    price: Number(meal.price),
    accent: ["coral", "gold", "leaf", "sky"][index % 4],
    symbol: meal.name.slice(0, 1).toUpperCase(),
    imageUrl: imageUrl(meal.image_url),
    preparationTime: meal.preparation_time ?? 15,
    isAvailable: meal.is_available,
  };
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function getMarketplaceFromApi(
  apiUrl: string,
): Promise<MarketplaceResult> {
  const response = await fetch(`${apiUrl}/vendors`, {
    next: { revalidate: 60 },
  });
  if (!response.ok)
    throw new Error(`Vendors request failed: ${response.status}`);

  const payload = (await response.json()) as { vendors?: ApiVendor[] };
  const apiVendors = payload.vendors ?? [];
  const details = await Promise.all(
    apiVendors.map(async (vendor) => {
      const detailResponse = await fetch(`${apiUrl}/vendors/${vendor.id}`, {
        next: { revalidate: 60 },
      });
      if (!detailResponse.ok)
        throw new Error(`Vendor details failed: ${detailResponse.status}`);
      return (await detailResponse.json()) as VendorDetailResponse;
    }),
  );

  const vendors = details.map(({ vendor }, index) => mapVendor(vendor, index));
  const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const meals = details.flatMap(({ menu = [] }) =>
    menu.flatMap((meal, index) => {
      const vendor = vendorsById.get(meal.vendor_id);
      return vendor ? [mapMeal(meal, vendor, index)] : [];
    }),
  );

  return { vendors, meals, isDemo: false };
}

async function getMarketplaceFromSupabase(): Promise<MarketplaceResult | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const [
    { data: vendorRows, error: vendorsError },
    { data: menuRows, error: menuError },
  ] = await Promise.all([
    supabase
      .from("vendors")
      .select(
        "id, business_name, description, rating, total_reviews, is_open, cover_image, latitude, longitude, delivery_fee, estimated_delivery_time, address, category_tags, delivery_radius_km",
      ),
    supabase
      .from("menu_items")
      .select(
        "id, vendor_id, name, description, price, image_url, category, preparation_time, is_available",
      )
      .eq("is_available", true),
  ]);

  if (vendorsError || menuError) return null;

  const vendors = (vendorRows as ApiVendor[]).map(mapVendor);
  const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const meals = (menuRows as ApiMeal[]).flatMap((meal, index) => {
    const vendor = vendorsById.get(meal.vendor_id);
    return vendor ? [mapMeal(meal, vendor, index)] : [];
  });

  return { vendors, meals, isDemo: false };
}

export async function getVendors(): Promise<{
  vendors: Vendor[];
  isDemo: boolean;
}> {
  const apiUrl = apiBase();
  if (apiUrl) {
    try {
      const result = await getMarketplaceFromApi(apiUrl);
      return { vendors: result.vendors, isDemo: false };
    } catch {}
  }

  const supabaseResult = await getMarketplaceFromSupabase();
  if (supabaseResult) return { vendors: supabaseResult.vendors, isDemo: false };

  return { vendors: demoVendors, isDemo: true };
}

export async function getVendorBySlug(
  slug: string,
): Promise<{ vendor: Vendor | null; meals: Meal[]; isDemo: boolean }> {
  const { vendors, meals, isDemo } = await getMarketplace();
  const vendor = vendors.find((item) => item.slug === slug) ?? null;
  return {
    vendor,
    meals: vendor ? meals.filter((meal) => meal.vendorId === vendor.id) : [],
    isDemo,
  };
}

export async function getMarketplace(): Promise<{
  vendors: Vendor[];
  meals: Meal[];
  isDemo: boolean;
}> {
  const apiUrl = apiBase();
  if (apiUrl) {
    try {
      return await getMarketplaceFromApi(apiUrl);
    } catch {}
  }

  const supabaseResult = await getMarketplaceFromSupabase();
  return (
    supabaseResult ?? { vendors: demoVendors, meals: demoMeals, isDemo: true }
  );
}
