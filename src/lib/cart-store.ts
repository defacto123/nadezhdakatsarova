"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  key: string; // productId + variantId
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  image: string | null;
  unitPriceCents: number; // effective price (after product sale)
  originalUnitPriceCents: number;
  quantity: number;
  maxStock: number;
  size: string | null;
  color: string | null;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key" | "quantity">, qty?: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotalCents: () => number;
}

function makeKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? "default"}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) => {
        const key = makeKey(item.productId, item.variantId);
        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          if (existing) {
            const nextQty = Math.min(
              existing.quantity + qty,
              item.maxStock || 99,
            );
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: nextQty } : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, key, quantity: Math.min(qty, item.maxStock || 99) },
            ],
          };
        });
      },
      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      setQuantity: (key, qty) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.key === key
                ? { ...i, quantity: Math.max(1, Math.min(qty, i.maxStock || 99)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents: () =>
        get().items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
    }),
    { name: "boutique-cart" },
  ),
);
