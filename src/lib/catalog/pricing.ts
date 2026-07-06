/**
 * Awake SA illustrative pricing (Jul 2026 model)
 *
 * EU retail ex VAT → 20% distributor discount → ZAR at EUR_ZAR_RATE
 * Illustrative retail = distributor cost ZAR × (1 + margin) × (1 + VAT)
 *
 * Freight, customs duty, and clearance are NOT included — Judy/Richard
 * must apply the landed-cost formula before treating these as final sell prices.
 */

export const DISTRIBUTOR_DISCOUNT = 0.2
export const RETAIL_MARGIN = 0.35
export const VAT_RATE = 0.15
export const DEFAULT_EUR_ZAR_RATE = 18.55

export function getEurZarRate(): number {
  const raw =
    process.env.NEXT_PUBLIC_EUR_ZAR_RATE ?? process.env.EUR_ZAR_RATE
  if (raw) {
    const n = parseFloat(String(raw).replace(/^["']|["']$/g, ''))
    if (!Number.isNaN(n) && n > 0) return n
  }
  return DEFAULT_EUR_ZAR_RATE
}

export interface ComputedPricing {
  euRetailExVat: number
  distributorCostEur: number
  distributorCostZar: number
  priceExVAT: number
  price: number
  costEUR: number
}

export function computeIllustrativePricing(
  euRetailExVat: number,
  rate = getEurZarRate()
): ComputedPricing {
  const distributorCostEur = euRetailExVat * (1 - DISTRIBUTOR_DISCOUNT)
  const distributorCostZar = distributorCostEur * rate
  const priceExVAT = Math.round(distributorCostZar * (1 + RETAIL_MARGIN))
  const price = Math.round(priceExVAT * (1 + VAT_RATE))

  return {
    euRetailExVat,
    distributorCostEur: Math.round(distributorCostEur),
    distributorCostZar: Math.round(distributorCostZar),
    priceExVAT,
    price,
    costEUR: Math.round(distributorCostEur),
  }
}

/** Deterministic ZAR display — avoids en-ZA ICU differences between Node and browser. */
export function formatZarPrice(amount: number): string {
  const n = Math.round(amount)
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `R ${grouped}`
}
