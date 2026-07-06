/**
 * Awake SA physical inventory & fulfilment rules.
 *
 * In stock: boards on hand in Cape Town.
 * Pre-order: air-freighted from Sweden on order.
 */

export type FulfillmentType = 'in_stock' | 'preorder'

export interface ProductInventory {
  stockQuantity: number
  inStock: boolean
  fulfillment: FulfillmentType
  badge?: string
  /** Demo units available (not counted in sellable stock) */
  demoUnits?: number
  leadTimeWeeks?: string
}

const PREORDER: ProductInventory = {
  stockQuantity: 0,
  inStock: false,
  fulfillment: 'preorder',
  leadTimeWeeks: '4–6',
}

/** Sellable stock + fulfilment per product slug/id */
export const PRODUCT_INVENTORY: Record<string, ProductInventory> = {
  'ravik-explore': {
    stockQuantity: 2,
    inStock: true,
    fulfillment: 'in_stock',
    demoUnits: 1,
  },
  'ravik-adventure': {
    stockQuantity: 2,
    inStock: true,
    fulfillment: 'in_stock',
  },
}

export function getProductInventory(productId: string): ProductInventory {
  return PRODUCT_INVENTORY[productId] ?? PREORDER
}

export function fulfillmentLabel(inv: ProductInventory): string {
  if (inv.fulfillment === 'in_stock' && inv.stockQuantity > 0) {
    const demo =
      inv.demoUnits && inv.demoUnits > 0
        ? ` · ${inv.demoUnits} demo unit available for rides`
        : ''
    return `${inv.stockQuantity} in stock — ready to ship${demo}`
  }
  return `Pre-order · Air freight from Sweden (${inv.leadTimeWeeks || '4–6'} weeks)`
}
