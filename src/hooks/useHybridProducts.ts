/**
 * Hybrid Products Hook
 * 
 * Provides product data with automatic fallback:
 * 1. Try Supabase (if configured)
 * 2. Try Medusa (if available)
 * 3. Fall back to localStorage
 */

'use client'

import { useEffect, useState } from 'react'
import { useProductsStore, type EditableProduct } from '@/store/products'
import { getSupabaseProducts, hasSupabaseProducts, updateSupabaseProduct, addSupabaseProduct, deleteSupabaseProduct } from '@/lib/supabase-products'
import { useAdminProducts } from '@/lib/medusa-hooks'
import { useAdminStore } from '@/store/admin'

export function useHybridProducts() {
  const [products, setProducts] = useState<EditableProduct[]>([])
  const [dataSource, setDataSource] = useState<'supabase' | 'medusa' | 'local'>('local')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const localProducts = useProductsStore().products
  const updateLocalProduct = useProductsStore().updateProduct
  const addLocalProduct = useProductsStore().addProduct
  const deleteLocalProduct = useProductsStore().deleteProduct
  
  const { authMode } = useAdminStore()
  const { data: medusaData, isLoading: medusaLoading } = useAdminProducts()

  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true)
      setError(null)

      // Priority 1: Try Supabase
      if (hasSupabaseProducts()) {
        try {
          const supabaseProducts = await getSupabaseProducts()
          if (supabaseProducts.length > 0) {
            setProducts(supabaseProducts)
            setDataSource('supabase')
            setIsLoading(false)
            return
          }
        } catch (err: any) {
          console.error('Supabase products failed:', err)
          setError(err.message)
        }
      }

      // Priority 2: Try Medusa
      if (authMode === 'medusa' && medusaData?.products && medusaData.products.length > 0) {
        setProducts(medusaData.products)
        setDataSource('medusa')
        setIsLoading(false)
        return
      }

      // Priority 3: Use localStorage
      setProducts(localProducts)
      setDataSource('local')
      setIsLoading(false)
    }

    loadProducts()
  }, [authMode, medusaData, localProducts])

  // Update product based on data source
  const updateProduct = async (id: string, updates: Partial<EditableProduct>) => {
    if (dataSource === 'supabase') {
      const result = await updateSupabaseProduct(id, updates)
      if (result.success) {
        // Refresh products
        const updated = await getSupabaseProducts()
        setProducts(updated)
        return { success: true }
      }
      return result
    } else if (dataSource === 'medusa') {
      // Medusa update handled by admin hooks
      return { success: true }
    } else {
      // localStorage
      updateLocalProduct(id, updates)
      return { success: true }
    }
  }

  // Add product based on data source
  const addProduct = async (product: EditableProduct) => {
    if (dataSource === 'supabase') {
      const result = await addSupabaseProduct(product)
      if (result.success) {
        const updated = await getSupabaseProducts()
        setProducts(updated)
        return { success: true }
      }
      return result
    } else {
      addLocalProduct(product)
      return { success: true }
    }
  }

  // Delete product based on data source
  const deleteProduct = async (id: string) => {
    if (dataSource === 'supabase') {
      const result = await deleteSupabaseProduct(id)
      if (result.success) {
        const updated = await getSupabaseProducts()
        setProducts(updated)
        return { success: true }
      }
      return result
    } else {
      deleteLocalProduct(id)
      return { success: true }
    }
  }

  return {
    products,
    dataSource,
    isLoading: isLoading || (dataSource === 'medusa' && medusaLoading),
    error,
    updateProduct,
    addProduct,
    deleteProduct,
  }
}
