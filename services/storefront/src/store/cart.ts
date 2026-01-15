import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  product_id: string;
  title: string;
  variant_title?: string;
  thumbnail?: string;
  unit_price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity || 1;
            return { items: newItems };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) { get().removeItem(itemId); return; }
        set((state) => ({
          items: state.items.map((item) => item.id === itemId ? { ...item, quantity } : item),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () => get().items.reduce((total, item) => total + item.unit_price * item.quantity, 0),
    }),
    { name: "awake-cart", partialize: (state) => ({ items: state.items }) }
  )
);
