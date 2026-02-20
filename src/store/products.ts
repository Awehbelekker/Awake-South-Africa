// Editable products store
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRODUCTS as DEFAULT_PRODUCTS } from '@/lib/constants'

export interface MediaFile {
  id: string
  url: string
  type: 'image' | 'video'
  name?: string
  source?: 'upload' | 'drive' | 'url'
  driveId?: string
  thumbnail?: string
}

export interface VideoSections {
  product_intro?: {
    enabled: boolean
    url?: string
    title?: string
    description?: string
  }
  action_videos?: {
    enabled: boolean
    videos?: Array<{
      url: string
      title: string
      thumbnail?: string
      customThumbnail?: string
    }>
  }
}

export interface EditableProduct {
  id: string
  name: string
  price: number
  priceExVAT: number
  costEUR?: number
  category: string
  categoryTag?: string
  description?: string
  image?: string // Primary image (backward compatibility)
  images?: MediaFile[] // Multiple images
  videos?: MediaFile[] // Legacy product videos (deprecated - use video_sections)
  video_sections?: VideoSections // NEW: Structured video sections for "See It In Action"
  badge?: string
  battery?: string
  skillLevel?: string
  specs?: string[]
  features?: string[]
  whatsIncluded?: string[] // Package contents - what comes in the box
  inStock: boolean
  stockQuantity: number
}

interface ProductsStore {
  products: EditableProduct[]
  productSource: 'localStorage' | 'supabase' | 'medusa'
  updateProduct: (id: string, updates: Partial<EditableProduct>) => void
  addProduct: (product: EditableProduct) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void
  setProducts: (products: EditableProduct[], source?: 'localStorage' | 'supabase' | 'medusa') => void
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
      productSource: 'localStorage' as const,
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
      resetProducts: () => set({ products: flattenProducts(), productSource: 'localStorage' }),
      setProducts: (products, source = 'localStorage') => set({ products, productSource: source }),
      getProductById: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: 'products-storage',
    }
  )
)
