import type { Metadata } from "next";
import { MapPin, Search } from "lucide-react";

import { DemoNotice } from "@/components/demo-notice";
import { MarketplaceExplorer } from "@/components/marketplace-explorer";
import { getMarketplace } from "@/lib/streetplate-api";

export const metadata: Metadata = {
  title: "Find local food near you",
  description:
    "Explore local food vendors, kota, home-cooked meals and shisanyama near you.",
};

export default async function DiscoverPage() {
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
          <form className="discover-search">
            <div>
              <Search size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="discover-query">
                Search vendors or meals
              </label>
              <input
                id="discover-query"
                name="q"
                placeholder="Search vendors or meals"
              />
            </div>
            <div>
              <MapPin size={19} aria-hidden="true" />
              <label className="sr-only" htmlFor="discover-location">
                Delivery location
              </label>
              <input
                id="discover-location"
                name="location"
                placeholder="Delivery location"
              />
            </div>
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      {isDemo && (
        <div className="shell">
          <DemoNotice />
        </div>
      )}
      <MarketplaceExplorer vendors={vendors} meals={meals} />
    </>
  );
}
