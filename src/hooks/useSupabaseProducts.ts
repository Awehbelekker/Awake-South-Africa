/**
 * Custom hook to fetch and sync products from Supabase
 * Integrates with tenant context for multi-tenant support
 */
'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { getSupabaseProducts, hasSupabaseProducts } from '@/lib/supabase-products'
import { useProductsStore } from '@/store/products'
import type { EditableProduct } from '@/store/products'

export function useSupabaseProducts() {
  const { tenant, isLoading: tenantLoading } = useTenant()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const productsStore = useProductsStore()

  useEffect(() => {
    async function fetchAndSyncProducts() {
      // Wait for tenant to load
      if (tenantLoading) return

      // Check if Supabase is configured
      if (!hasSupabaseProducts()) {
        console.log('Supabase not configured, using localStorage products')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch products for current tenant
        const tenantId = tenant?.id
        console.log('Fetching products for tenant:', tenantId || 'all', tenant?.name || 'unknown')
        
        const products = await getSupabaseProducts(tenantId)
        
        if (products && products.length > 0) {
          console.log(`✅ Loaded ${products.length} products from Supabase for ${tenant?.name || 'default'}`)          
          // Update the Zustand store with Supabase products
          productsStore.setProducts(products, 'supabase')
        } else {
          console.warn('No products found in Supabase, keeping localStorage products')
        }
      } catch (err) {
        console.error('Error fetching products from Supabase:', err)
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAndSyncProducts()
  }, [tenant?.id, tenantLoading])

  return {
    isLoading: tenantLoading || isLoading,
    error,
    hasSupabase: hasSupabaseProducts(),
    tenantId: tenant?.id,
  }
}
