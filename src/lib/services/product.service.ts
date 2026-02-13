/**
 * Supabase Product Service
 * Handles all product-related database operations
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Product } from '@/types/supabase'

export class ProductService {
  /**
   * Get all products with optional filtering
   */
  static async getAllProducts(filters?: {
    category?: string
    inStock?: boolean
    featured?: boolean
    limit?: number
    offset?: number
  }) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true) // Only show in-stock items by default

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      query = query.order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      console.error('Error fetching products:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get a single product by slug
   */
  static async getProductBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error

      return { success: true, data: data as Product }
    } catch (error) {
      console.error('Error fetching product:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: data as Product }
    } catch (error) {
      console.error('Error fetching product:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Search products by query
   */
  static async searchProducts(query: string, limit = 20) {
    try {
      const { data, error } = await supabase
        .rpc('search_products', {
          search_query: query,
          result_limit: limit
        })

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      // Fallback to simple text search if RPC not available
      const { data, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit)

      return { 
        success: !fallbackError, 
        data: data as Product[], 
        error: fallbackError 
      }
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('in_stock', true)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      console.error('Error fetching products by category:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 8) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('in_stock', true)
        .limit(limit)

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      console.error('Error fetching featured products:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get new arrivals
   */
  static async getNewArrivals(limit = 8) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_new', true)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(productId: string, category: string, limit = 4) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', productId)
        .eq('in_stock', true)
        .limit(limit)

      if (error) throw error

      return { success: true, data: data as Product[] }
    } catch (error) {
      console.error('Error fetching related products:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Create a new product (Admin only)
   */
  static async createProduct(product: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...product,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data: data as Product }
    } catch (error) {
      console.error('Error creating product:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Update a product (Admin only)
   */
  static async updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data: data as Product }
    } catch (error) {
      console.error('Error updating product:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Delete a product (Admin only)
   */
  static async deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting product:', error)
      return { success: false, error }
    }
  }

  /**
   * Update product stock
   */
  static async updateStock(productId: string, quantity: number) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ stock_quantity: quantity })
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data: data as Product }
    } catch (error) {
      console.error('Error updating product stock:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category, in_stock')

      if (error) throw error

      const stats = {
        total: data.length,
        inStock: data.filter(p => p.in_stock).length,
        outOfStock: data.filter(p => !p.in_stock).length,
        byCategory: {} as Record<string, number>
      }

      data.forEach(product => {
        stats.byCategory[product.category] = (stats.byCategory[product.category] || 0) + 1
      })

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching product stats:', error)
      return { success: false, error, data: null }
    }
  }

  /**
   * Bulk import products (for migration from constants.ts)
   */
  static async bulkImportProducts(products: Partial<Product>[]) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(products)
        .select()

      if (error) throw error

      return { success: true, data: data as Product[], count: data.length }
    } catch (error) {
      console.error('Error bulk importing products:', error)
      return { success: false, error, data: [], count: 0 }
    }
  }

  /**
   * Check if Supabase is configured and fallback to localStorage if needed
   */
  static isUsingSupabase() {
    return isSupabaseConfigured()
  }
}

export default ProductService
