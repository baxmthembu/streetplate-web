"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/cart-provider";
import type { Meal } from "@/lib/site-data";

export function AddToCartButton({ meal }: { meal: Meal }) {
  const { addItem } = useCart();
  const [message, setMessage] = useState("");

  return (
    <div className="add-control">
      <button
        type="button"
        className="add-button"
        aria-label={`Add ${meal.name} to cart`}
        onClick={() => {
          const result = addItem({
            id: meal.id,
            vendorId: meal.vendorId,
            vendorSlug: meal.vendorSlug,
            vendorName: meal.vendorName,
            name: meal.name,
            description: meal.description,
            category: meal.category,
            accent: meal.accent,
            imageUrl: meal.imageUrl,
            price: meal.price,
          });
          setMessage(
            result.replacedVendor
              ? "Cart switched to this vendor"
              : "Added to cart",
          );
          window.setTimeout(() => setMessage(""), 1800);
        }}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
