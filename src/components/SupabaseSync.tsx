/**
 * Supabase Sync Component
 * Automatically syncs products from Supabase to Zustand store
 * This component should be included in the root layout
 */
'use client'

import { useSupabaseProducts } from '@/hooks/useSupabaseProducts'
import { useEffect } from 'react'

export function SupabaseSync() {
  const { isLoading, error, hasSupabase, tenantId } = useSupabaseProducts()

  useEffect(() => {
    if (!isLoading) {
      if (hasSupabase) {
        console.log('✅ Products synced from Supabase for tenant:', tenantId || 'all')
      } else {
        console.log('📦 Using localStorage products (Supabase not configured)')
      }
    }
  }, [isLoading, hasSupabase, tenantId])

  useEffect(() => {
    if (error) {
      console.error('❌ Failed to sync products from Supabase:', error)
    }
  }, [error])

  // This component doesn't render anything - it just handles data sync
  return null
}
