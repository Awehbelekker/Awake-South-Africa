'use client'

/**
 * Debug panel to show product source and tenant info
 * Only visible in development mode
 */

import { useProductsStore } from '@/store/products'
import { useTenant } from '@/contexts/TenantContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export function DebugPanel() {
  const [show, setShow] = useState(false)
  const { products } = useProductsStore()
  const { tenant, isLoading } = useTenant()
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    // Show debug info in console
    if (isDev) {
      console.log('🔧 Debug Info:', {
        productCount: products.length,
        supabaseConfigured: isSupabaseConfigured(),
        tenant: tenant?.name || 'Not loaded',
        tenantId: tenant?.id || 'N/A'
      })
    }
  }, [products.length, tenant, isDev])

  if (!isDev) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShow(!show)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        {show ? '✖ Close' : '🔧 Debug'}
      </button>
      
      {show && (
        <div className="absolute bottom-12 right-0 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl w-80 max-h-96 overflow-auto text-sm">
          <h3 className="text-white font-bold mb-3 text-base">System Status</h3>
          
          <div className="space-y-2">
            <div className="border-b border-gray-700 pb-2">
              <div className="text-gray-400">Supabase:</div>
              <div className={isSupabaseConfigured() ? 'text-green-400' : 'text-red-400'}>
                {isSupabaseConfigured() ? '✅ Connected' : '❌ Not configured'}
              </div>
            </div>

            <div className="border-b border-gray-700 pb-2">
              <div className="text-gray-400">Tenant:</div>
              {isLoading ? (
                <div className="text-yellow-400">⏳ Loading...</div>
              ) : tenant ? (
                <div className="text-green-400">
                  ✅ {tenant.name}
                  <div className="text-xs text-gray-500 mt-1">ID: {tenant.id.slice(0, 8)}...</div>
                </div>
              ) : (
                <div className="text-red-400">❌ Not found</div>
              )}
            </div>

            <div className="border-b border-gray-700 pb-2">
              <div className="text-gray-400">Products:</div>
              <div className="text-blue-400">📦 {products.length} items</div>
            </div>

            <div className="pt-2">
              <div className="text-gray-400 mb-1">Categories:</div>
              {products.length > 0 ? (
                <div className="text-xs text-gray-300 space-y-1">
                  {Object.entries(
                    products.reduce((acc, p) => {
                      const cat = p.category || 'uncategorized'
                      acc[cat] = (acc[cat] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([cat, count]) => (
                    <div key={cat} className="flex justify-between">
                      <span>{cat}:</span>
                      <span className="text-blue-400">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs">No products loaded</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
