/**
 * Customer Intelligence Service
 * 
 * Analyzes customer behavior and provides insights
 * Ported from Aweh Be Lekker Invoicing System with database integration
 * 
 * Features:
 * - Purchase history analysis
 * - Payment behavior tracking
 * - Product preferences
 * - Lifetime value calculation
 * - Churn risk detection
 */

import { createClient } from '@/lib/supabase/client'

export interface CustomerInsights {
  customerId: string
  avgOrderValue: number
  totalRevenue: number
  orderCount: number
  daysSinceLastOrder: number | null
  avgPaymentDays: number | null
  commonProducts: Array<{ productId: string; sku: string; count: number }>
  preferredPaymentMethod: string | null
  churnRisk: 'low' | 'medium' | 'high'
  lifetimeValue: number
  firstOrderDate: Date | null
  lastOrderDate: Date | null
}

export interface CustomerRecommendation {
  type: 'discount' | 'follow-up' | 'upsell' | 'warning'
  message: string
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
}

/**
 * Analyze customer purchase behavior and payment patterns
 */
export async function analyzeCustomer(
  customerId: string,
  tenantId: string
): Promise<CustomerInsights> {
  const supabase = createClient()

  // Get all orders for this customer
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      created_at,
      status,
      payment_status,
      items:order_items(product_id, sku, quantity),
      payments:order_payments(payment_method, paid_at)
    `)
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error || !orders || orders.length === 0) {
    return {
      customerId,
      avgOrderValue: 0,
      totalRevenue: 0,
      orderCount: 0,
      daysSinceLastOrder: null,
      avgPaymentDays: null,
      commonProducts: [],
      preferredPaymentMethod: null,
      churnRisk: 'low',
      lifetimeValue: 0,
      firstOrderDate: null,
      lastOrderDate: null,
    }
  }

  // Calculate total revenue and average order value
  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const avgOrderValue = totalRevenue / orders.length

  // Days since last order
  const lastOrder = orders[0] // Already sorted by created_at desc
  const daysSinceLastOrder = Math.floor(
    (new Date().getTime() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Average payment days
  const paidOrders = orders.filter(
    (order) => order.payment_status === 'paid' && order.payments && order.payments.length > 0
  )
  let avgPaymentDays: number | null = null
  if (paidOrders.length > 0) {
    const paymentDays = paidOrders.map((order) => {
      const orderDate = new Date(order.created_at)
      const paymentDate = new Date(order.payments[0].paid_at)
      return Math.floor((paymentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
    })
    avgPaymentDays = Math.round(
      paymentDays.reduce((sum, days) => sum + days, 0) / paymentDays.length
    )
  }

  // Find common products
  const productFrequency: Record<string, { productId: string; sku: string; count: number }> = {}
  orders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        const key = item.sku
        if (!productFrequency[key]) {
          productFrequency[key] = {
            productId: item.product_id,
            sku: item.sku,
            count: 0,
          }
        }
        productFrequency[key].count += item.quantity || 1
      })
    }
  })

  const commonProducts = Object.values(productFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Preferred payment method
  const paymentMethods: Record<string, number> = {}
  orders.forEach((order) => {
    if (order.payments && order.payments.length > 0) {
      const method = order.payments[0].payment_method
      paymentMethods[method] = (paymentMethods[method] || 0) + 1
    }
  })
  const preferredPaymentMethod =
    Object.keys(paymentMethods).length > 0
      ? Object.entries(paymentMethods).sort((a, b) => b[1] - a[1])[0][0]
      : null

  // Churn risk calculation
  let churnRisk: 'low' | 'medium' | 'high' = 'low'
  if (daysSinceLastOrder > 180) {
    churnRisk = 'high'
  } else if (daysSinceLastOrder > 90) {
    churnRisk = 'medium'
  }

  // First and last order dates
  const firstOrderDate = orders.length > 0 ? new Date(orders[orders.length - 1].created_at) : null
  const lastOrderDate = orders.length > 0 ? new Date(orders[0].created_at) : null

  return {
    customerId,
    avgOrderValue,
    totalRevenue,
    orderCount: orders.length,
    daysSinceLastOrder,
    avgPaymentDays,
    commonProducts,
    preferredPaymentMethod,
    churnRisk,
    lifetimeValue: totalRevenue,
    firstOrderDate,
    lastOrderDate,
  }
}

/**
 * Generate actionable recommendations based on customer insights
 */
export function generateRecommendations(insights: CustomerInsights): CustomerRecommendation[] {
  const recommendations: CustomerRecommendation[] = []

  // Churn risk recommendations
  if (insights.daysSinceLastOrder !== null) {
    if (insights.daysSinceLastOrder > 180) {
      recommendations.push({
        type: 'discount',
        message: `It's been ${insights.daysSinceLastOrder} days since last order. Consider offering a special discount to re-engage.`,
        priority: 'high',
        actionable: true,
      })
    } else if (insights.daysSinceLastOrder > 90) {
      recommendations.push({
        type: 'follow-up',
        message: `Customer hasn't ordered in ${insights.daysSinceLastOrder} days. Send a follow-up email.`,
        priority: 'medium',
        actionable: true,
      })
    } else if (insights.daysSinceLastOrder < 7) {
      recommendations.push({
        type: 'warning',
        message: `Last order was only ${insights.daysSinceLastOrder} days ago. Check for potential duplicate.`,
        priority: 'medium',
        actionable: false,
      })
    }
  }

  // Payment behavior recommendations
  if (insights.avgPaymentDays !== null) {
    if (insights.avgPaymentDays > 45) {
      recommendations.push({
        type: 'warning',
        message: `This customer typically pays in ${insights.avgPaymentDays} days. Consider shorter payment terms or upfront deposit.`,
        priority: 'medium',
        actionable: true,
      })
    } else if (insights.avgPaymentDays < 15) {
      recommendations.push({
        type: 'upsell',
        message: `Great payer! Average payment time: ${insights.avgPaymentDays} days. Consider offering premium products.`,
        priority: 'low',
        actionable: true,
      })
    }
  }

  // Lifetime value recommendations
  if (insights.lifetimeValue > 50000) {
    recommendations.push({
      type: 'upsell',
      message: `High-value customer (R${insights.lifetimeValue.toLocaleString()}). Offer VIP treatment and exclusive deals.`,
      priority: 'high',
      actionable: true,
    })
  }

  return recommendations
}

