/**
 * Supabase Order Service
 * Handles all order-related database operations
 */

import { supabase } from '@/lib/supabase'

export interface CreateOrderData {
  customer_id?: string
  customer_email: string
  customer_phone?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total: number
  shipping_address: object
  billing_address: object
  payment_method: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
  customer_notes?: string
}

export interface UpdateOrderData {
  status?: string
  payment_status?: string
  fulfillment_status?: string
  tracking_number?: string
  tracking_url?: string
  admin_notes?: string
}

export class OrderService {
  /**
   * Generate a unique order number
   */
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `AWK-${timestamp}-${random}`
  }

  /**
   * Create a new order
   */
  static async createOrder(orderData: CreateOrderData) {
    try {
      const orderNumber = this.generateOrderNumber()

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: orderData.customer_id || null,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone || null,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount,
          shipping_amount: orderData.shipping_amount,
          discount_amount: orderData.discount_amount,
          total: orderData.total,
          shipping_address: orderData.shipping_address,
          billing_address: orderData.billing_address,
          payment_method: orderData.payment_method,
          customer_notes: orderData.customer_notes || null,
          status: 'pending',
          payment_status: 'pending',
          fulfillment_status: 'unfulfilled',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return { success: true, data: order }
    } catch (error) {
      console.error('Error creating order:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(id: string) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: order }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('order_number', orderNumber)
        .single()

      if (error) throw error

      return { success: true, data: order }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get orders by customer ID
   */
  static async getCustomerOrders(customerId: string) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (*)
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: orders }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Update order
   */
  static async updateOrder(id: string, updates: UpdateOrderData) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error updating order:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Mark order as paid
   */
  static async markOrderAsPaid(
    orderId: string, 
    paymentReference: string,
    paymentMethod: string = 'payfast'
  ) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_reference: paymentReference,
          payment_method: paymentMethod,
          paid_at: new Date().toISOString(),
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Create payment transaction record
      await supabase
        .from('payment_transactions')
        .insert({
          order_id: orderId,
          gateway: paymentMethod,
          transaction_id: paymentReference,
          amount: data.total,
          currency: data.currency,
          status: 'completed'
        })

      return { success: true, data }
    } catch (error) {
      console.error('Error marking order as paid:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(id: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          admin_notes: reason || 'Order cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Update order fulfillment status
   */
  static async updateFulfillmentStatus(
    id: string, 
    status: string,
    trackingNumber?: string,
    trackingUrl?: string
  ) {
    try {
      const updates: any = {
        fulfillment_status: status,
        updated_at: new Date().toISOString()
      }

      if (trackingNumber) updates.tracking_number = trackingNumber
      if (trackingUrl) updates.tracking_url = trackingUrl
      if (status === 'fulfilled') updates.shipped_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error updating fulfillment status:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get all orders (Admin)
   */
  static async getAllOrders(filters?: {
    status?: string
    payment_status?: string
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (count)
        `, { count: 'exact' })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return { success: true, data, count }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return { success: false, error, data: [], count: 0 }
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStats() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, payment_status, total, created_at')

      if (error) throw error

      const stats = {
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        confirmed: data.filter(o => o.status === 'confirmed').length,
        processing: data.filter(o => o.status === 'processing').length,
        shipped: data.filter(o => o.status === 'shipped').length,
        delivered: data.filter(o => o.status === 'delivered').length,
        cancelled: data.filter(o => o.status === 'cancelled').length,
        totalRevenue: data
          .filter(o => o.payment_status === 'paid')
          .reduce((sum, o) => sum + Number(o.total), 0),
        averageOrderValue: data.length > 0 
          ? data.reduce((sum, o) => sum + Number(o.total), 0) / data.length 
          : 0,
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching order stats:', error)
      return { success: false, error, data: null }
    }
  }
}

export default OrderService
