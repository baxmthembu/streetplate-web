import "server-only";

import { demoMeals, demoVendors, type Meal, type Vendor } from "./site-data";

type ApiVendor = {
  id: string;
  business_name: string;
  description: string | null;
  rating: number | string | null;
  total_reviews: number | null;
  is_open: boolean;
};

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
  const apiUrl = process.env.STREETPLATE_API_URL;
  if (!apiUrl) return { vendors: demoVendors, isDemo: true };

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/vendors`, {
      next: { revalidate: 60 },
    });
    if (!response.ok)
      throw new Error(`Vendors request failed: ${response.status}`);

    const payload = (await response.json()) as { vendors?: ApiVendor[] };
    const vendors = (payload.vendors ?? []).map((vendor, index) => ({
      id: vendor.id,
      slug: `${toSlug(vendor.business_name)}-${vendor.id}`,
      name: vendor.business_name,
      description: vendor.description ?? "Local food made in your community.",
      category: "Local food",
      neighbourhood: "Nearby",
      rating: Number(vendor.rating ?? 0),
      reviewCount: vendor.total_reviews ?? 0,
      deliveryFee: 0,
      eta: [30, 45] as [number, number],
      isOpen: vendor.is_open,
      accent: ["coral", "gold", "leaf"][index % 3],
    }));

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

  // Phase one intentionally avoids the existing GET /api/vendors/:id endpoint:
  // it returns every vendor column, including fields that are not public-safe.
  return {
    vendor,
    meals: isDemo ? demoMeals.filter((meal) => meal.vendorSlug === slug) : [],
    isDemo,
  };
}
