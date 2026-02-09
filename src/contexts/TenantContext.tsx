'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Tenant } from '@/types/supabase'

interface PaymentGatewayInfo {
  code: string
  name: string
  isDefault: boolean
  isSandbox: boolean
}

interface TenantContextType {
  tenant: Tenant | null
  paymentGateways: PaymentGatewayInfo[]
  isLoading: boolean
  error: string | null
  refetchTenant: () => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  paymentGateways: [],
  isLoading: true,
  error: null,
  refetchTenant: async () => {},
})

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detectTenant = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use the tenant API which handles subdomain/domain detection via middleware
      const response = await fetch('/api/tenant')
      const data = await response.json()

      if (data.error && !data.tenant) {
        setError(data.error)
        return
      }

      if (data.tenant) {
        setTenant(data.tenant as Tenant)
        setPaymentGateways(data.paymentGateways || [])
      }
    } catch (err) {
      console.error('Tenant detection error:', err)
      setError('Failed to load tenant configuration')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    detectTenant()
  }, [])

  // Apply CSS variables for dynamic theming
  useEffect(() => {
    if (tenant && typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--color-primary', tenant.primary_color)
      document.documentElement.style.setProperty('--color-secondary', tenant.secondary_color)
      document.documentElement.style.setProperty('--color-accent', tenant.accent_color)
      
      // Update favicon if provided
      if (tenant.favicon_url) {
        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
        if (favicon) {
          favicon.href = tenant.favicon_url
        }
      }
      
      // Update document title
      document.title = tenant.name
    }
  }, [tenant])

  return (
    <TenantContext.Provider value={{ tenant, paymentGateways, isLoading, error, refetchTenant: detectTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

export { TenantContext }

