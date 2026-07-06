export type PricingStatus = 'illustrative' | 'contact'

export interface CatalogProduct {
  id: string
  name: string
  category: string
  categoryTag: string
  description?: string
  image?: string
  badge?: string
  battery?: string
  skillLevel?: string
  specs?: string[]
  features?: string[]
  whatsIncluded?: string[]
  euRetailExVat?: number
  pricingStatus: PricingStatus
  price: number | null
  priceExVAT: number | null
  costEUR?: number
  priceDisplay: string
  contactForPricing: boolean
  compareSpecs?: Record<string, string>
}

export interface CatalogProductDef {
  id: string
  name: string
  category: string
  categoryTag: string
  description?: string
  image?: string
  badge?: string
  battery?: string
  skillLevel?: string
  specs?: string[]
  features?: string[]
  whatsIncluded?: string[]
  euRetailExVat?: number
  pricingStatus?: PricingStatus
  compareSpecs?: Record<string, string>
  /** @deprecated slug redirects here */
  legacySlugs?: string[]
}
