import { Plus } from "lucide-react";

import { formatRand } from "@/lib/format";
import type { Meal } from "@/lib/site-data";

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="meal-card">
      <div className={`meal-visual tone-${meal.accent}`} aria-hidden="true">
        {meal.symbol}
      </div>
      <div className="meal-card-body">
        <p className="eyebrow">{meal.category}</p>
        <h3>{meal.name}</h3>
        <p>{meal.description}</p>
        <div className="meal-bottom">
          <strong>{formatRand(meal.price)}</strong>
          <button
            type="button"
            className="add-button"
            aria-label={`Add ${meal.name} to cart`}
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
