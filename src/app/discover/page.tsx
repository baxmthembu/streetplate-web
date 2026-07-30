import type { Metadata } from "next";
import { Filter, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { DemoNotice } from "@/components/demo-notice";
import { VendorCard } from "@/components/vendor-card";
import { categories } from "@/lib/site-data";
import { getVendors } from "@/lib/streetplate-api";

export const metadata: Metadata = {
  title: "Find local food near you",
  description:
    "Explore local food vendors, kota, home-cooked meals and shisanyama near you.",
};

export default async function DiscoverPage() {
  const { vendors, isDemo } = await getVendors();

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

      <section className="shell discover-layout">
        <aside className="filters" aria-label="Vendor filters">
          <div className="filter-title">
            <Filter size={18} aria-hidden="true" />
            <h2>Filters</h2>
          </div>
          <fieldset>
            <legend>Category</legend>
            {categories.slice(0, 5).map((category) => (
              <label key={category.label}>
                <input type="checkbox" name="category" value={category.label} />
                {category.label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Availability</legend>
            <label>
              <input type="checkbox" name="open" />
              Open now
            </label>
            <label>
              <input type="checkbox" name="promoted" />
              Featured
            </label>
          </fieldset>
          <fieldset>
            <legend>Delivery fee</legend>
            <label>
              <input type="radio" name="fee" value="any" defaultChecked />
              Any fee
            </label>
            <label>
              <input type="radio" name="fee" value="under-20" />
              Under R20
            </label>
          </fieldset>
        </aside>

        <div className="discover-results">
          <div className="results-bar">
            <div>
              <p className="eyebrow">Available choices</p>
              <h2>{vendors.length} vendors</h2>
            </div>
            <button type="button">
              <SlidersHorizontal size={17} aria-hidden="true" />
              Sort: Recommended
            </button>
          </div>
          {isDemo && <DemoNotice />}
          <div className="vendor-grid vendor-grid-results">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
