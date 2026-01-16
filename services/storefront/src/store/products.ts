// Editable products store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/lib/constants'

export interface EditableProduct {
  id: string
  name: string
  price: number
  priceExVAT: number
  costEUR?: number
  category: string
  categoryTag?: string
  description?: string
  image?: string
  badge?: string
  battery?: string
  skillLevel?: string
  specs?: string[]
  features?: string[]
  inStock: boolean
  stockQuantity: number
}

interface ProductsStore {
  products: EditableProduct[]
  updateProduct: (id: string, updates: Partial<EditableProduct>) => void
  addProduct: (product: EditableProduct) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void
  getProductById: (id: string) => EditableProduct | undefined
}

// Flatten default products
const flattenProducts = (): EditableProduct[] => {
  const allProducts = [
    ...DEFAULT_PRODUCTS.jetboards,
    ...DEFAULT_PRODUCTS.limitedEdition,
    ...DEFAULT_PRODUCTS.efoils,
    ...DEFAULT_PRODUCTS.batteries,
    ...DEFAULT_PRODUCTS.boardsOnly,
    ...DEFAULT_PRODUCTS.wings,
    ...DEFAULT_PRODUCTS.bags,
    ...DEFAULT_PRODUCTS.safetyStorage,
    ...DEFAULT_PRODUCTS.electronics,
    ...DEFAULT_PRODUCTS.parts,
    ...DEFAULT_PRODUCTS.apparel,
  ].map(p => ({
    ...p,
    inStock: true,
    stockQuantity: 5,
  }))
  return allProducts
}

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set, get) => ({
      products: flattenProducts(),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),
      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),
      resetProducts: () => set({ products: flattenProducts() }),
      getProductById: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: 'products-storage',
    }
  )
)
