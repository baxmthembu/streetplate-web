"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { MealCard } from "@/components/meal-card";
import type { Meal } from "@/lib/site-data";

export function VendorMenu({ meals }: { meals: Meal[] }) {
  const [query, setQuery] = useState("");
  const filteredMeals = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return meals;

    return meals.filter((meal) =>
      `${meal.name} ${meal.description} ${meal.category}`
        .toLowerCase()
        .includes(needle),
    );
  }, [meals, query]);

  return (
    <>
      <div className="menu-topbar">
        <div>
          <p className="eyebrow">Made fresh</p>
          <h2>Menu</h2>
        </div>
        <label className="menu-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search this menu</span>
          <input
            type="search"
            placeholder="Search this menu"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-controls="vendor-menu-results"
          />
        </label>
      </div>
      {filteredMeals.length > 0 ? (
        <div
          className="meal-grid meal-grid-menu"
          id="vendor-menu-results"
          aria-live="polite"
        >
          {filteredMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      ) : (
        <div className="empty-state" id="vendor-menu-results" role="status">
          {meals.length > 0 ? (
            <>
              <h3>No menu items match your search.</h3>
              <p>Try a different meal name or category.</p>
            </>
          ) : (
            <>
              <h3>No menu items are available right now.</h3>
              <p>Check back when the vendor has published available items.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
