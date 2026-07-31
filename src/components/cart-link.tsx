"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/components/cart-provider";

export function CartLink() {
  const { itemCount } = useCart();
  return (
    <Link
      className="icon-link cart-link"
      href="/cart"
      aria-label="Open your cart"
    >
      <ShoppingBag size={20} aria-hidden="true" />
      {itemCount > 0 && (
        <span aria-label={`${itemCount} cart items`}>{itemCount}</span>
      )}
    </Link>
  );
}
