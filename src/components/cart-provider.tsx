"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  name: string;
  description: string;
  category?: string;
  accent?: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
  notes: string;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity" | "notes">) => {
    replacedVendor: boolean;
  };
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "streetplate-cart:v1";

function validStoredCart(value: unknown): value is CartItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.vendorId === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    )
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (validStoredCart(parsed)) setItems(parsed);
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated)
      window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity" | "notes">) => {
    let replacedVendor = false;
    setItems((current) => {
      const sameVendor =
        current.length === 0 || current[0].vendorId === item.vendorId;
      const base = sameVendor ? current : [];
      replacedVendor = !sameVendor;
      const existing = base.find((entry) => entry.id === item.id);
      if (existing) {
        return base.map((entry) =>
          entry.id === item.id
            ? { ...entry, ...item, quantity: entry.quantity + 1 }
            : entry,
        );
      }
      return [...base, { ...item, quantity: 1, notes: "" }];
    });
    return { replacedVendor };
  }, []);

  const clearCart = useCallback(() => {
    setItems((current) => (current.length === 0 ? current : []));
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      addItem,
      updateQuantity(id, quantity) {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(1, Math.min(100, quantity)) }
              : item,
          ),
        );
      },
      updateNotes(id, notes) {
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, notes: notes.slice(0, 300) } : item,
          ),
        );
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clearCart,
    }),
    [addItem, clearCart, hydrated, items],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
