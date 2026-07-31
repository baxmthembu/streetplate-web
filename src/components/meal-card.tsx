import { AddToCartButton } from "@/components/add-to-cart-button";
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
          <AddToCartButton meal={meal} />
        </div>
      </div>
    </article>
  );
}
