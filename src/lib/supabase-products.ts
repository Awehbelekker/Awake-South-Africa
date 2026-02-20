/**
 * Supabase Products Service
 * 
 * Handles fetching and managing products from Supabase database
 */

import { supabase, isSupabaseConfigured } from './supabase'
import type { EditableProduct } from '@/store/products'

// Check if Supabase is available
export function hasSupabaseProducts(): boolean {
  return isSupabaseConfigured()
}

// Fetch all products from Supabase (with optional tenant filtering)
export async function getSupabaseProducts(tenantId?: string): Promise<EditableProduct[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    let query = supabase
      .from('products')
      .select('*')
    
    // Filter by tenant if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products from Supabase:', error)
      return []
    }

    // Map Supabase products to EditableProduct format
    return (data || []).map(mapSupabaseToProduct)
  } catch (error) {
    console.error('Failed to fetch products from Supabase:', error)
    return []
  }
}

// Get single product by ID or slug (with optional tenant filtering)
export async function getSupabaseProduct(idOrSlug: string, tenantId?: string): Promise<EditableProduct | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    let query = supabase
      .from('products')
      .select('*')
      .or(`slug.eq.${idOrSlug},sku.eq.${idOrSlug}`)
    
    // Filter by tenant if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return mapSupabaseToProduct(data)
  } catch (error) {
    console.error('Failed to fetch product from Supabase:', error)
    return null
  }
}

// Get products by category (with optional tenant filtering)
export async function getSupabaseProductsByCategory(category: string, tenantId?: string): Promise<EditableProduct[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    let query = supabase
      .from('products')
      .select('*')
      .eq('category', category)
    
    // Filter by tenant if provided
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    const { data, error } = await query.order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching products by category:', error)
      return []
    }

    return (data || []).map(mapSupabaseToProduct)
  } catch (error) {
    console.error('Failed to fetch products by category:', error)
    return []
  }
}

// Update product in Supabase
export async function updateSupabaseProduct(
  id: string,
  updates: Partial<EditableProduct>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const productData: any = {}

    if (updates.name) productData.name = updates.name
    if (updates.description) productData.description = updates.description
    if (updates.price !== undefined) productData.price = updates.price
    if (updates.priceExVAT !== undefined) productData.original_price = updates.priceExVAT * 1.15
    if (updates.category) productData.category = updates.category
    if (updates.categoryTag) productData.subcategory = updates.categoryTag
    if (updates.inStock !== undefined) productData.in_stock = updates.inStock
    if (updates.stockQuantity !== undefined) productData.stock_quantity = updates.stockQuantity
    if (updates.image) productData.thumbnail = updates.image
    if (updates.images) {
      productData.images = updates.images.map(img =>
        typeof img === 'string' ? img : img.url
      )
    }
    if (updates.specs) productData.specifications = updates.specs
    if (updates.features) productData.features = updates.features
    if (updates.badge) productData.is_featured = true

    productData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('sku', id)

    if (error) {
      console.error('Error updating product in Supabase:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update product in Supabase:', error)
    return { success: false, error: error.message }
  }
}

// Add new product to Supabase
export async function addSupabaseProduct(
  product: EditableProduct
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const productData = {
      slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: product.name,
      description: product.description || '',
      price: product.price,
      original_price: product.priceExVAT ? product.priceExVAT * 1.15 : null,
      currency: 'ZAR',
      category: product.category,
      subcategory: product.categoryTag,
      in_stock: product.inStock,
      stock_quantity: product.stockQuantity,
      sku: product.id,
      images: product.images?.map(img => typeof img === 'string' ? img : img.url) || [],
      thumbnail: product.image,
      specifications: product.specs || [],
      features: product.features || [],
      tags: [product.badge, product.skillLevel, product.battery].filter(Boolean),
      is_featured: !!product.badge,
    }

    const { error } = await supabase
      .from('products')
      .insert(productData)

    if (error) {
      console.error('Error adding product to Supabase:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to add product to Supabase:', error)
    return { success: false, error: error.message }
  }
}

// Delete product from Supabase
export async function deleteSupabaseProduct(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('sku', id)

    if (error) {
      console.error('Error deleting product from Supabase:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete product from Supabase:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to map Supabase product to EditableProduct format
function mapSupabaseToProduct(data: any): EditableProduct {
  return {
    id: data.sku || data.slug,
    name: data.name,
    price: parseFloat(data.price),
    priceExVAT: data.original_price ? parseFloat(data.original_price) / 1.15 : parseFloat(data.price) / 1.15,
    costEUR: data.cost_eur,
    category: data.category,
    categoryTag: data.subcategory,
    description: data.description,
    image: data.thumbnail,
    images: data.images?.map((url: string) => ({
      id: url,
      url,
      type: 'image' as const,
      source: 'url' as const,
    })) || [],
    badge: data.is_featured ? 'FEATURED' : data.is_new ? 'NEW' : undefined,
    battery: data.tags?.find((t: string) => t?.includes('V') || t?.includes('Ah')),
    skillLevel: data.tags?.find((t: string) => ['Beginner', 'Intermediate', 'Advanced', 'Pro'].includes(t)),
    specs: data.specifications || [],
    features: data.features || [],
    inStock: data.in_stock,
    stockQuantity: data.stock_quantity,
  }
}
