import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  variantName?: string;
  lineItemId?: string;
}

interface CartState {
  items: CartItem[];
  medusaCartId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variantId?: string) => void;
  updateQuantity: (id: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  total: () => number;
  setMedusaCartId: (id: string | null) => void;
  syncFromMedusa: (items: CartItem[], cartId: string) => void;
}

const lineMatch = (a: CartItem, id: string, variantId?: string) =>
  a.id === id && (variantId ? a.variantId === variantId : !a.variantId)

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      medusaCartId: null,

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.id === item.id && i.variantId === item.variantId
          )
          if (existingIndex > -1) {
            const newItems = [...state.items]
            newItems[existingIndex].quantity += item.quantity || 1
            return { items: newItems }
          }
          return { items: [...state.items, { ...item, quantity: item.quantity || 1 }] }
        })
      },

      removeItem: (id, variantId) => {
        set((state) => ({
          items: state.items.filter((item) => !lineMatch(item, id, variantId)),
        }))
      },

      updateQuantity: (id, quantity, variantId) => {
        if (quantity < 1) {
          get().removeItem(id, variantId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            lineMatch(item, id, variantId) ? { ...item, quantity } : item
          ),
        }))
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
