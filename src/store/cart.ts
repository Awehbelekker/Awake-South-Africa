import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string; // Medusa variant ID for API operations
  lineItemId?: string; // Medusa line item ID for updates
}

interface CartState {
  items: CartItem[];
  medusaCartId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  setMedusaCartId: (id: string | null) => void;
  syncFromMedusa: (items: CartItem[], cartId: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      medusaCartId: null,

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

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
        }));
      },

      clearCart: () => set({ items: [], medusaCartId: null }),

      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      setMedusaCartId: (id) => set({ medusaCartId: id }),

      // Sync cart state from Medusa response
      syncFromMedusa: (items, cartId) => set({ items, medusaCartId: cartId }),
    }),
    { name: "awake-cart" }
  )
);
