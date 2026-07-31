export type Vendor = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  neighbourhood: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  eta: [number, number];
  isOpen: boolean;
  accent: string;
  promoted?: boolean;
  coverImage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  deliveryRadius?: number | null;
};

export type Meal = {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  name: string;
  description: string;
  category: string;
  price: number;
  accent: string;
  symbol: string;
  imageUrl?: string | null;
  preparationTime?: number;
  isAvailable?: boolean;
};

// Clearly labelled design fixtures. Production screens replace these through
// src/lib/streetplate-api.ts when STREETPLATE_API_URL is configured.
export const demoVendors: Vendor[] = [
  {
    id: "demo-vendor-1",
    slug: "soweto-kota-corner",
    name: "Soweto Kota Corner",
    description: "Generous kotas made fresh with local favourites.",
    category: "Kota",
    neighbourhood: "Orlando West",
    rating: 4.8,
    reviewCount: 0,
    deliveryFee: 14,
    eta: [25, 35],
    isOpen: true,
    accent: "coral",
    promoted: true,
    coverImage: "/food/kota.png",
  },
  {
    id: "demo-vendor-2",
    slug: "mamas-home-kitchen",
    name: "Mama's Home Kitchen",
    description: "Comforting pap, stew and seasonal home-style plates.",
    category: "Home-cooked",
    neighbourhood: "Diepkloof",
    rating: 4.7,
    reviewCount: 0,
    deliveryFee: 18,
    eta: [30, 45],
    isOpen: true,
    accent: "gold",
    coverImage: "/food/pap-beef-stew.png",
  },
  {
    id: "demo-vendor-3",
    slug: "vilakazi-shisanyama",
    name: "Vilakazi Shisanyama",
    description: "Flame-grilled favourites, sides and sharing plates.",
    category: "Shisanyama",
    neighbourhood: "Orlando East",
    rating: 4.9,
    reviewCount: 0,
    deliveryFee: 22,
    eta: [35, 50],
    isOpen: false,
    accent: "charcoal",
    coverImage: "/food/shisanyama.png",
  },
];

export const demoMeals: Meal[] = [
  {
    id: "demo-meal-1",
    vendorId: "demo-vendor-1",
    vendorSlug: "soweto-kota-corner",
    vendorName: "Soweto Kota Corner",
    name: "Classic Kota",
    description: "Fresh bread, chips, atchar, polony and egg.",
    category: "Kota",
    price: 48,
    accent: "coral",
    symbol: "K",
    imageUrl: "/food/kota.png",
  },
  {
    id: "demo-meal-2",
    vendorId: "demo-vendor-2",
    vendorSlug: "mamas-home-kitchen",
    vendorName: "Mama's Home Kitchen",
    name: "Pap & Beef Stew",
    description: "Slow-cooked beef stew with pap and two sides.",
    category: "Home-cooked",
    price: 89,
    accent: "gold",
    symbol: "P",
    imageUrl: "/food/pap-beef-stew.png",
  },
  {
    id: "demo-meal-3",
    vendorId: "demo-vendor-3",
    vendorSlug: "vilakazi-shisanyama",
    vendorName: "Vilakazi Shisanyama",
    name: "Grill Plate",
    description: "Flame-grilled chicken, wors, pap and chakalaka.",
    category: "Shisanyama",
    price: 119,
    accent: "charcoal",
    symbol: "S",
    imageUrl: "/food/shisanyama.png",
  },
  {
    id: "demo-meal-4",
    vendorId: "demo-vendor-2",
    vendorSlug: "mamas-home-kitchen",
    vendorName: "Mama's Home Kitchen",
    name: "Amagwinya & Mince",
    description: "Two warm amagwinya with savoury mince.",
    category: "Breakfast",
    price: 42,
    accent: "leaf",
    symbol: "A",
    imageUrl: "/food/amagwinya-mince.png",
  },
];

export const categories = [
  { label: "Kota", image: "/food/kota.png", tone: "coral" },
  {
    label: "Home-cooked",
    image: "/food/pap-beef-stew.png",
    tone: "gold",
  },
  { label: "Shisanyama", image: "/food/shisanyama.png", tone: "charcoal" },
  {
    label: "Amagwinya",
    image: "/food/amagwinya-mince.png",
    tone: "leaf",
  },
  { label: "Chicken", image: "/food/grilled-chicken.png", tone: "sky" },
  { label: "Bunny chow", image: "/food/bunny-chow.png", tone: "plum" },
];

const foodImageRules = [
  { terms: ["bunny"], image: "/food/bunny-chow.png" },
  {
    terms: ["amagwinya", "vetkoek", "fat cake"],
    image: "/food/amagwinya-mince.png",
  },
  { terms: ["chicken"], image: "/food/grilled-chicken.png" },
  {
    terms: ["shisanyama", "grill", "braai", "wors"],
    image: "/food/shisanyama.png",
  },
  { terms: ["kota"], image: "/food/kota.png" },
] as const;

function isSupportedRemoteImage(candidate: string) {
  try {
    const { hostname, protocol } = new URL(candidate);
    return (
      protocol === "https:" &&
      (hostname === "res.cloudinary.com" || hostname.endsWith(".supabase.co"))
    );
  } catch {
    return false;
  }
}

export function foodImageFor(
  category: string,
  name = "",
  candidate?: string | null,
) {
  if (
    candidate?.startsWith("/") ||
    (candidate && isSupportedRemoteImage(candidate))
  ) {
    return candidate;
  }

  const description = `${category} ${name}`.toLowerCase();
  return (
    foodImageRules.find(({ terms }) =>
      terms.some((term) => description.includes(term)),
    )?.image ?? "/food/pap-beef-stew.png"
  );
}
