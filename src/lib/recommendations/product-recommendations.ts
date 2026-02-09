/**
 * Product Recommendations Service
 * 
 * Provides "Customers also bought" recommendations
 * Ported from Aweh Be Lekker Invoicing System with database integration
 * 
 * Features:
 * - Frequently bought together analysis
 * - Cross-sell recommendations
 * - Upsell suggestions
 * - Personalized recommendations per customer
 */

import { createClient } from '@/lib/supabase/client'

export interface ProductRecommendation {
  productId: string
  sku: string
  name: string
  score: number // Frequency score
  reason: 'frequently_bought_together' | 'customer_history' | 'category_match' | 'trending'
}

export interface RecommendationOptions {
  limit?: number
  minScore?: number
  excludeProductIds?: string[]
  customerId?: string
}

/**
 * Find products frequently bought together with the given products
 * Based on "Customers also bought" algorithm from Aweh Be Lekker repo
 */
export async function findRelatedProducts(
  productIds: string[],
  tenantId: string,
  options: RecommendationOptions = {}
): Promise<ProductRecommendation[]> {
  const {
    limit = 10,
    minScore = 1,
    excludeProductIds = [],
    customerId,
  } = options

  const supabase = createClient()

  // Find orders that contain any of the current products
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      items:order_items(product_id, sku, quantity, product:products(name))
    `)
    .eq('tenant_id', tenantId)
    .in('items.product_id', productIds)

  if (error || !orders) {
    return []
  }

  // Count frequency of other products in those orders
  const productFrequency: Record<string, { productId: string; sku: string; name: string; count: number }> = {}

  orders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        // Skip if it's one of the current products or excluded products
        if (productIds.includes(item.product_id) || excludeProductIds.includes(item.product_id)) {
          return
        }

        const key = item.product_id
        if (!productFrequency[key]) {
          productFrequency[key] = {
            productId: item.product_id,
            sku: item.sku,
            name: item.product?.name || 'Unknown Product',
            count: 0,
          }
        }
        productFrequency[key].count += 1
      })
    }
  })

  // Convert to array and sort by frequency
  const recommendations: ProductRecommendation[] = Object.values(productFrequency)
    .filter((item) => item.count >= minScore)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      score: item.count,
      reason: 'frequently_bought_together' as const,
    }))

  return recommendations
}

/**
 * Get personalized recommendations for a specific customer
 * Based on their purchase history
 */
export async function getPersonalizedRecommendations(
  customerId: string,
  tenantId: string,
  options: RecommendationOptions = {}
): Promise<ProductRecommendation[]> {
  const { limit = 10, excludeProductIds = [] } = options

  const supabase = createClient()

  // Get customer's purchase history
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      items:order_items(product_id, sku, quantity, product:products(name, category))
    `)
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20) // Last 20 orders

  if (error || !orders || orders.length === 0) {
    return []
  }

  // Extract product IDs from customer's history
  const purchasedProductIds: string[] = []
  orders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        if (!purchasedProductIds.includes(item.product_id)) {
          purchasedProductIds.push(item.product_id)
        }
      })
    }
  })

  // Find related products based on purchase history
  const recommendations = await findRelatedProducts(purchasedProductIds, tenantId, {
    limit,
    excludeProductIds: [...excludeProductIds, ...purchasedProductIds],
  })

  // Mark as customer history recommendations
  return recommendations.map((rec) => ({
    ...rec,
    reason: 'customer_history' as const,
  }))
}

/**
 * Get trending products (most frequently ordered recently)
 */
export async function getTrendingProducts(
  tenantId: string,
  options: RecommendationOptions = {}
): Promise<ProductRecommendation[]> {
  const { limit = 10, excludeProductIds = [] } = options

  const supabase = createClient()

  // Get orders from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      items:order_items(product_id, sku, quantity, product:products(name))
    `)
    .eq('tenant_id', tenantId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  if (error || !orders) {
    return []
  }

  // Count product frequency
  const productFrequency: Record<string, { productId: string; sku: string; name: string; count: number }> = {}

  orders.forEach((order: any) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        if (excludeProductIds.includes(item.product_id)) {
          return
        }

        const key = item.product_id
        if (!productFrequency[key]) {
          productFrequency[key] = {
            productId: item.product_id,
            sku: item.sku,
            name: item.product?.name || 'Unknown Product',
            count: 0,
          }
        }
        productFrequency[key].count += item.quantity || 1
      })
    }
  })

  // Convert to recommendations
  const recommendations: ProductRecommendation[] = Object.values(productFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      score: item.count,
      reason: 'trending' as const,
    }))

  return recommendations
}

