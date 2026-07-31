"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { MealCard } from "@/components/meal-card";
import { VendorCard } from "@/components/vendor-card";
import type { Meal, Vendor } from "@/lib/site-data";

export function MarketplaceExplorer({
  vendors,
  meals,
}: {
  vendors: Vendor[];
  meals: Meal[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const [fee, setFee] = useState("any");
  const [sort, setSort] = useState("recommended");
  const categories = useMemo(
    () => Array.from(new Set(vendors.map((vendor) => vendor.category))).sort(),
    [vendors],
  );
  const filteredVendors = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return vendors
      .filter(
        (vendor) =>
          !needle ||
          `${vendor.name} ${vendor.description} ${vendor.category}`
            .toLowerCase()
            .includes(needle),
      )
      .filter((vendor) => category === "all" || vendor.category === category)
      .filter((vendor) => !openOnly || vendor.isOpen)
      .filter((vendor) => fee === "any" || vendor.deliveryFee < 20)
      .toSorted((left, right) =>
        sort === "fee"
          ? left.deliveryFee - right.deliveryFee
          : sort === "rating"
            ? right.rating - left.rating
            : Number(right.isOpen) - Number(left.isOpen),
      );
  }, [category, fee, openOnly, query, sort, vendors]);
  const filteredMeals = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return meals.filter(
      (meal) =>
        needle &&
        `${meal.name} ${meal.description} ${meal.category} ${meal.vendorName}`
          .toLowerCase()
          .includes(needle),
    );
  }, [meals, query]);

  return (
    <section className="shell discover-layout">
      <aside className="filters" aria-label="Vendor filters">
        <div className="filter-title">
          <Filter size={18} aria-hidden="true" />
          <h2>Filters</h2>
        </div>
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Availability</legend>
          <label>
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(event) => setOpenOnly(event.target.checked)}
            />
            Open now
          </label>
        </fieldset>
        <fieldset>
          <legend>Delivery fee</legend>
          <label>
            <input
              type="radio"
              name="fee"
              value="any"
              checked={fee === "any"}
              onChange={(event) => setFee(event.target.value)}
            />
            Any fee
          </label>
          <label>
            <input
              type="radio"
              name="fee"
              value="under-20"
              checked={fee === "under-20"}
              onChange={(event) => setFee(event.target.value)}
            />
            Under R20
          </label>
        </fieldset>
      </aside>
      <div className="discover-results">
        <label className="marketplace-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search vendors and meals</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendors or meals"
          />
        </label>
        <div className="results-bar">
          <div>
            <p className="eyebrow">Available choices</p>
            <h2>
              {filteredVendors.length}{" "}
              {filteredVendors.length === 1 ? "vendor" : "vendors"}
            </h2>
          </div>
          <label className="sort-select">
            <SlidersHorizontal size={17} aria-hidden="true" />
            <span className="sr-only">Sort vendors</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Highest rated</option>
              <option value="fee">Lowest fee</option>
            </select>
          </label>
        </div>
        {filteredVendors.length ? (
          <div className="vendor-grid vendor-grid-results">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No matching vendors</h3>
            <p>Try a broader search or remove a filter.</p>
          </div>
        )}
        {filteredMeals.length > 0 && (
          <>
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Menu matches</p>
                <h2>{filteredMeals.length} meals</h2>
              </div>
            </div>
            <div className="meal-grid meal-grid-menu">
              {filteredMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
