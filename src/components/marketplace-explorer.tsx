"use client";

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { MealCard } from "@/components/meal-card";
import { VendorCard } from "@/components/vendor-card";
import type { Meal, Vendor } from "@/lib/site-data";

const foodTypes = [
  {
    id: "all",
    label: "All food",
    keywords: [],
    position: "0% 0%",
  },
  {
    id: "kotas",
    label: "Kotas",
    keywords: ["kota"],
    position: "33.333% 0%",
  },
  {
    id: "traditional",
    label: "Traditional",
    keywords: [
      "traditional",
      "home-cooked",
      "home cooked",
      "stew",
      "pap",
      "mogodu",
      "beef",
    ],
    position: "66.667% 0%",
  },
  {
    id: "braai",
    label: "Braai",
    keywords: ["braai", "shisanyama", "grill", "wors", "meat"],
    position: "100% 0%",
  },
  {
    id: "fast-food",
    label: "Fast food",
    keywords: [
      "fast food",
      "bunny chow",
      "bunny",
      "wors roll",
      "burger",
      "chips",
      "fries",
    ],
    position: "0% 100%",
  },
  {
    id: "breakfast",
    label: "Breakfast",
    keywords: ["breakfast", "magwinya", "vetkoek", "fat cake"],
    position: "33.333% 100%",
  },
  {
    id: "bakery-dessert",
    label: "Bakery & dessert",
    keywords: ["bakery", "cake", "dessert", "pudding", "pastry", "sweet"],
    position: "66.667% 100%",
  },
  {
    id: "chicken",
    label: "Chicken",
    keywords: ["chicken"],
    position: "100% 100%",
  },
] as const;

const foodTypeAliases: Record<string, (typeof foodTypes)[number]["id"]> = {
  "all food": "all",
  kota: "kotas",
  "home-cooked": "traditional",
  "home cooked": "traditional",
  shisanyama: "braai",
  amagwinya: "breakfast",
  "bunny chow": "fast-food",
  "fast food": "fast-food",
  "bakery & dessert": "bakery-dessert",
};

function resolveFoodType(category?: string) {
  const normalized = category?.trim().toLowerCase();
  if (!normalized) return "all";

  return (
    foodTypes.find((item) => item.id === normalized)?.id ??
    foodTypes.find((item) => item.label.toLowerCase() === normalized)?.id ??
    foodTypeAliases[normalized] ??
    "all"
  );
}

export function MarketplaceExplorer({
  vendors,
  meals,
  initialQuery = "",
  initialCategory,
}: {
  vendors: Vendor[];
  meals: Meal[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const query = initialQuery;
  const [foodType, setFoodType] = useState(() =>
    resolveFoodType(initialCategory),
  );
  const [openOnly, setOpenOnly] = useState(false);
  const [fee, setFee] = useState("any");
  const [minimumRating, setMinimumRating] = useState("any");
  const [maximumEta, setMaximumEta] = useState("any");
  const [sort, setSort] = useState("recommended");
  const foodTypeList = useRef<HTMLElement>(null);
  const mealsByVendor = useMemo(
    () =>
      meals.reduce<Map<string, Meal[]>>((grouped, meal) => {
        const vendorMeals = grouped.get(meal.vendorId) ?? [];
        vendorMeals.push(meal);
        grouped.set(meal.vendorId, vendorMeals);
        return grouped;
      }, new Map()),
    [meals],
  );
  const filteredVendors = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const selectedFoodType = foodTypes.find((item) => item.id === foodType);

    return vendors
      .filter((vendor) => {
        const vendorMeals = mealsByVendor.get(vendor.id) ?? [];
        const searchable = [
          vendor.name,
          vendor.description,
          vendor.category,
          ...vendorMeals.flatMap((meal) => [
            meal.name,
            meal.description,
            meal.category,
          ]),
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !needle || searchable.includes(needle);
        const matchesFoodType =
          !selectedFoodType ||
          selectedFoodType.id === "all" ||
          selectedFoodType.keywords.some((keyword) =>
            searchable.includes(keyword),
          );

        return matchesQuery && matchesFoodType;
      })
      .filter((vendor) => !openOnly || vendor.isOpen)
      .filter((vendor) => fee === "any" || vendor.deliveryFee <= Number(fee))
      .filter(
        (vendor) =>
          minimumRating === "any" || vendor.rating >= Number(minimumRating),
      )
      .filter(
        (vendor) => maximumEta === "any" || vendor.eta[0] <= Number(maximumEta),
      )
      .toSorted((left, right) => {
        if (sort === "fee") return left.deliveryFee - right.deliveryFee;
        if (sort === "rating") return right.rating - left.rating;
        if (sort === "eta") return left.eta[0] - right.eta[0];
        if (sort === "popular") return right.reviewCount - left.reviewCount;
        return (
          Number(right.isOpen) - Number(left.isOpen) ||
          Number(Boolean(right.promoted)) - Number(Boolean(left.promoted)) ||
          right.rating - left.rating
        );
      });
  }, [
    fee,
    foodType,
    maximumEta,
    mealsByVendor,
    minimumRating,
    openOnly,
    query,
    sort,
    vendors,
  ]);
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

  function scrollFoodTypes(direction: -1 | 1) {
    foodTypeList.current?.scrollBy({
      behavior: "smooth",
      left: direction * Math.min(520, window.innerWidth * 0.72),
    });
  }

  const activeFilterCount =
    Number(foodType !== "all") +
    Number(openOnly) +
    Number(fee !== "any") +
    Number(minimumRating !== "any") +
    Number(maximumEta !== "any");

  function resetFilters() {
    setFoodType("all");
    setOpenOnly(false);
    setFee("any");
    setMinimumRating("any");
    setMaximumEta("any");
  }

  return (
    <>
      <section
        className="food-types-section"
        aria-labelledby="food-types-title"
      >
        <div className="shell">
          <div className="food-types-heading">
            <h2 id="food-types-title">Popular food types</h2>
            <div className="food-types-arrows" aria-label="Scroll food types">
              <button
                type="button"
                onClick={() => scrollFoodTypes(-1)}
                aria-label="Scroll food types left"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollFoodTypes(1)}
                aria-label="Scroll food types right"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
          <nav
            className="food-type-list"
            ref={foodTypeList}
            aria-label="Food type filters"
          >
            {foodTypes.map((item) => (
              <button
                className="food-type-button"
                type="button"
                key={item.id}
                aria-pressed={foodType === item.id}
                onClick={() => setFoodType(item.id)}
              >
                <span
                  className="food-type-art"
                  style={{ backgroundPosition: item.position }}
                  aria-hidden="true"
                />
                <strong>{item.label}</strong>
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className="shell discover-layout">
        <aside className="filters" aria-label="Vendor filters">
          <div className="filter-header">
            <div className="filter-title">
              <span className="filter-title-icon">
                <Filter size={18} aria-hidden="true" />
              </span>
              <div>
                <h2>Find your plate</h2>
                <p>Fine-tune nearby choices</p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <span
                className="filter-count"
                aria-label={`${activeFilterCount} active filters`}
              >
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="filter-sections">
            <div className="filter-section filter-category">
              <label htmlFor="filter-category">Food type</label>
              <select
                id="filter-category"
                value={foodType}
                onChange={(event) =>
                  setFoodType(resolveFoodType(event.target.value))
                }
              >
                {foodTypes.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <span className="filter-section-label">Availability</span>
              <label className="filter-toggle-row">
                <span>
                  <strong>Open now</strong>
                  <small>Ready to accept orders</small>
                </span>
                <input
                  className="sr-only"
                  type="checkbox"
                  checked={openOnly}
                  onChange={(event) => setOpenOnly(event.target.checked)}
                />
                <span className="filter-switch" aria-hidden="true" />
              </label>
            </div>

            <fieldset className="filter-section">
              <legend>Delivery fee</legend>
              {[
                ["any", "Any fee"],
                ["20", "Up to R20"],
                ["30", "Up to R30"],
              ].map(([value, label]) => (
                <label className="filter-option" key={value}>
                  <input
                    type="radio"
                    name="fee"
                    value={value}
                    checked={fee === value}
                    onChange={(event) => setFee(event.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="filter-section">
              <legend>Minimum rating</legend>
              {[
                ["any", "Any rating"],
                ["4", "4.0 and above"],
                ["4.5", "4.5 and above"],
              ].map(([value, label]) => (
                <label className="filter-option" key={value}>
                  <input
                    type="radio"
                    name="minimum-rating"
                    value={value}
                    checked={minimumRating === value}
                    onChange={(event) => setMinimumRating(event.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="filter-section">
              <legend>Delivery time</legend>
              {[
                ["any", "Any time"],
                ["30", "Within 30 min"],
                ["45", "Within 45 min"],
              ].map(([value, label]) => (
                <label className="filter-option" key={value}>
                  <input
                    type="radio"
                    name="maximum-eta"
                    value={value}
                    checked={maximumEta === value}
                    onChange={(event) => setMaximumEta(event.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <button
            className="filter-reset"
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
          >
            <RotateCcw size={16} aria-hidden="true" />
            Reset filters
          </button>
        </aside>
        <div className="discover-results">
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
                <option value="eta">Fastest delivery</option>
                <option value="popular">Most reviewed</option>
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
    </>
  );
}
