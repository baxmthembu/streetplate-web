import type { Metadata } from "next";

import { DemoNotice } from "@/components/demo-notice";
import { DiscoverSearchForm } from "@/components/discover-search-form";
import { MarketplaceExplorer } from "@/components/marketplace-explorer";
import { isWithinDeliveryRadius } from "@/lib/commerce-rules";
import { getMarketplace } from "@/lib/streetplate-api";

export const metadata: Metadata = {
  title: "Find local food near you",
  description:
    "Explore local food vendors, kota, home-cooked meals and shisanyama near you.",
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
  }>;
}) {
  const params = await searchParams;
  const { vendors, meals, isDemo } = await getMarketplace();

  const customerLatitude = Number(params.latitude);
  const customerLongitude = Number(params.longitude);
  const hasLocation =
    params.latitude !== undefined &&
    params.longitude !== undefined &&
    Number.isFinite(customerLatitude) &&
    Number.isFinite(customerLongitude);

  const visibleVendors = hasLocation
    ? vendors.filter((vendor) =>
        isWithinDeliveryRadius(vendor, customerLatitude, customerLongitude),
      )
    : vendors;
  const visibleVendorIds = hasLocation
    ? new Set(visibleVendors.map((vendor) => vendor.id))
    : null;
  const visibleMeals = visibleVendorIds
    ? meals.filter((meal) => visibleVendorIds.has(meal.vendorId))
    : meals;

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Find food near you</p>
          <h1>Your neighbourhood menu</h1>
          <p>
            Search local vendors and meals. Set an address to see which vendors
            deliver to you.
          </p>
          <DiscoverSearchForm
            initialQuery={params.q}
            initialLocation={params.location}
            initialLatitude={params.latitude}
            initialLongitude={params.longitude}
          />
          {hasLocation && (
            <p className="discover-location-summary" role="status">
              Showing {visibleVendors.length}{" "}
              {visibleVendors.length === 1
                ? "vendor that delivers"
                : "vendors that deliver"}{" "}
              to {params.location || "this address"}.
            </p>
          )}
        </div>
      </section>

      {isDemo && (
        <div className="shell">
          <DemoNotice />
        </div>
      )}
      <MarketplaceExplorer
        key={`${params.q ?? ""}:${params.category ?? ""}:${params.latitude ?? ""}:${params.longitude ?? ""}`}
        vendors={visibleVendors}
        meals={visibleMeals}
        initialQuery={params.q}
        initialCategory={params.category}
      />
    </>
  );
}
