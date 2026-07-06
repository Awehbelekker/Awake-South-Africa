/**
 * Resolves distributor cost (EUR) from the Jul 2026 catalog model.
 * For landed-cost PDF figures, see AWAKE_PRICE_LIST_2025_COMPLETE.pdf (legacy).
 */

import { getCatalogProductById } from './catalog'

export function resolveCostEur(productId: string): number | undefined {
  return getCatalogProductById(productId)?.costEUR
}

export function resolvePrices(productId: string) {
  const p = getCatalogProductById(productId)
  if (!p || p.contactForPricing) return undefined
  return {
    landedExVatZar: undefined,
    retailExVatZar: p.priceExVAT ?? undefined,
    retailIncVatZar: p.price ?? undefined,
  }
}

export function marginOnCost(landedOrCostZar: number, priceExVat: number): number {
  if (!landedOrCostZar) return 0
  return ((priceExVat - landedOrCostZar) / landedOrCostZar) * 100
}
