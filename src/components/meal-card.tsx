import Image from "next/image";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatRand } from "@/lib/format";
import { foodImageFor, type Meal } from "@/lib/site-data";

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="meal-card">
      <div className={`meal-visual tone-${meal.accent}`}>
        <Image
          className="food-card-image"
          src={foodImageFor(meal.category, meal.name, meal.imageUrl)}
          alt={`${meal.name} from ${meal.vendorName}`}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 25vw"
        />
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
