import { CATALOG_DEFINITIONS, COMPARE_PRODUCT_IDS } from './definitions'
import {
  computeIllustrativePricing,
  formatZarPrice,
  getEurZarRate,
} from './pricing'
import type { CatalogProduct, CatalogProductDef } from './types'

const CONTACT_LABEL = 'Contact for pricing'

function resolvePricing(def: CatalogProductDef) {
  if (def.pricingStatus === 'contact' || def.euRetailExVat == null) {
    return {
      pricingStatus: 'contact' as const,
      price: null,
      priceExVAT: null,
      costEUR: undefined,
      priceDisplay: CONTACT_LABEL,
      contactForPricing: true,
    }
  }

  const computed = computeIllustrativePricing(def.euRetailExVat)
  return {
    pricingStatus: 'illustrative' as const,
    price: computed.price,
    priceExVAT: computed.priceExVAT,
    costEUR: computed.costEUR,
    priceDisplay: formatZarPrice(computed.price),
    contactForPricing: false,
  }
}

export function buildCatalogProduct(def: CatalogProductDef): CatalogProduct {
  const pricing = resolvePricing(def)
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    categoryTag: def.categoryTag,
    description: def.description,
    image: def.image,
    badge: def.badge,
    battery: def.battery,
    skillLevel: def.skillLevel,
    specs: def.specs,
    features: def.features,
    whatsIncluded: def.whatsIncluded,
    euRetailExVat: def.euRetailExVat,
    compareSpecs: def.compareSpecs,
    ...pricing,
  }
}

export function getFlatCatalogProducts(): CatalogProduct[] {
  return CATALOG_DEFINITIONS.map(buildCatalogProduct)
}

export function getCatalogProductById(id: string): CatalogProduct | undefined {
  const direct = CATALOG_DEFINITIONS.find((d) => d.id === id)
  if (direct) return buildCatalogProduct(direct)

  const viaLegacy = CATALOG_DEFINITIONS.find((d) => d.legacySlugs?.includes(id))
  if (viaLegacy) return buildCatalogProduct(viaLegacy)

  return undefined
}

export function getCompareProducts(): CatalogProduct[] {
  return COMPARE_PRODUCT_IDS.map((id) => getCatalogProductById(id)!)
}

/** Grouped shape consumed by legacy `PRODUCTS` constant */
export function getProductGroups() {
  const all = getFlatCatalogProducts()
  const byCategory = (cat: string) =>
    all.filter((p) => p.category === cat).map(toLegacyProductShape)

  return {
    jetboards: all
      .filter((p) => p.category === 'jetboards' && p.id !== 'brabus-shadow-explore')
      .map(toLegacyProductShape),
    limitedEdition: all
      .filter((p) => p.id === 'brabus-shadow-explore')
      .map(toLegacyProductShape),
    efoils: byCategory('efoils'),
    batteries: byCategory('batteries'),
    boardsOnly: byCategory('boards'),
    wings: all.filter((p) => p.category === 'wings').map(toLegacyProductShape),
    bags: all.filter((p) => p.categoryTag === 'Bag').map(toLegacyProductShape),
    safetyStorage: all
      .filter((p) => ['Safety', 'Storage'].includes(p.categoryTag))
      .map(toLegacyProductShape),
    electronics: all
      .filter((p) => p.categoryTag === 'Electronics')
      .map(toLegacyProductShape),
    parts: all
      .filter((p) => p.categoryTag === 'Parts')
      .map(toLegacyProductShape),
    apparel: byCategory('apparel'),
  }
}

/** Legacy product shape for zustand store / admin sync */
export function toLegacyProductShape(p: CatalogProduct) {
  return {
    id: p.id,
    name: p.name,
    price: p.price ?? 0,
    priceExVAT: p.priceExVAT ?? 0,
    costEUR: p.costEUR,
    category: p.category,
    categoryTag: p.categoryTag,
    description: p.description,
    image: p.image,
    badge: p.badge,
    battery: p.battery,
    skillLevel: p.skillLevel,
    specs: p.specs,
    features: p.features,
    whatsIncluded: p.whatsIncluded,
    contactForPricing: p.contactForPricing,
    priceDisplay: p.priceDisplay,
    pricingStatus: p.pricingStatus,
  }
}

export function getCategoryStartingPrice(category: 'jetboards' | 'efoils'): string {
  const products = getFlatCatalogProducts().filter(
    (p) => p.category === category && !p.contactForPricing && p.price != null
  )
  if (products.length === 0) return CONTACT_LABEL
  const min = Math.min(...products.map((p) => p.price!))
  return formatZarPrice(min)
}

export function getLegacySlugRedirects(): Record<string, string> {
  const redirects: Record<string, string> = {}
  for (const def of CATALOG_DEFINITIONS) {
    for (const slug of def.legacySlugs ?? []) {
      redirects[slug] = def.id
    }
  }
  return redirects
}

export { getEurZarRate, formatZarPrice, computeIllustrativePricing }
