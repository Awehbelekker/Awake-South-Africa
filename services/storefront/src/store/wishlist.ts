import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  product_id: string;
  title: string;
  thumbnail?: string;
  unit_price: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (!get().items.some((i) => i.product_id === item.product_id)) {
          set((state) => ({ items: [...state.items, item] }));
        }
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((item) => item.product_id !== productId) }));
      },
      isInWishlist: (productId) => get().items.some((item) => item.product_id === productId),
    }),
    { name: "awake-wishlist" }
  )
);
