import type { Metadata } from "next";

import { DemoNotice } from "@/components/demo-notice";
import { DiscoverSearchForm } from "@/components/discover-search-form";
import { MarketplaceExplorer } from "@/components/marketplace-explorer";
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

  return (
    <>
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Find food near you</p>
          <h1>Your neighbourhood menu</h1>
          <p>
            Search local vendors and meals. Set an address to confirm delivery
            availability, distance and accurate fees.
          </p>
          <DiscoverSearchForm
            initialQuery={params.q}
            initialLocation={params.location}
            initialLatitude={params.latitude}
            initialLongitude={params.longitude}
          />
        </div>
      </section>

      {isDemo && (
        <div className="shell">
          <DemoNotice />
        </div>
      )}
      <MarketplaceExplorer
        key={`${params.q ?? ""}:${params.category ?? ""}`}
        vendors={vendors}
        meals={meals}
        initialQuery={params.q}
        initialCategory={params.category}
      />
    </>
  );
}
