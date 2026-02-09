'use client'

import { useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface CogniCoreEmbedProps {
  /** Override the default CogniCore URL */
  baseUrl?: string
  /** Specific page to load (e.g., 'invoices', 'customers', 'dashboard') */
  page?: string
  /** Height of the iframe */
  height?: string
  /** Show open in new tab button */
  showExternalLink?: boolean
}

const DEFAULT_COGNICORE_URL = 'https://cogni-core-invoicing-system.vercel.app'

export default function CogniCoreEmbed({
  baseUrl = DEFAULT_COGNICORE_URL,
  page,
  height = 'calc(100vh - 120px)',
  showExternalLink = true,
}: CogniCoreEmbedProps) {
  const { tenant, isLoading } = useTenant()
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)

  // Construct the CogniCore URL with tenant business ID
  const buildCogniCoreUrl = () => {
    let url = baseUrl
    
    // If tenant has a CogniCore business ID, use it
    if (tenant?.cognicore_business_id) {
      url = `${baseUrl}/business/${tenant.cognicore_business_id}`
    }
    
    // Append specific page if provided
    if (page) {
      url = `${url}/${page}`
    }
    
    // Add tenant context as query params for white-label theming
    const params = new URLSearchParams()
    if (tenant) {
      params.set('tenant_name', tenant.name)
      params.set('primary_color', tenant.primary_color)
      if (tenant.logo_url) {
        params.set('logo_url', tenant.logo_url)
      }
    }
    
    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const cognicoreUrl = buildCogniCoreUrl()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading CogniCore...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Header with external link option */}
      {showExternalLink && (
        <div className="flex justify-end mb-2">
          <a
            href={cognicoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="w-4 h-4" />
            Open in new tab
          </a>
        </div>
      )}

      {/* Loading overlay */}
      {iframeLoading && !iframeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading invoicing system...</span>
        </div>
      )}

      {/* Error state */}
      {iframeError && (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <p className="text-red-700 font-medium">Failed to load CogniCore</p>
          <p className="text-red-600 text-sm mt-1">
            Please check your connection or{' '}
            <a
              href={cognicoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              open in new tab
            </a>
          </p>
        </div>
      )}

      {/* CogniCore iframe */}
      {!iframeError && (
        <iframe
          src={cognicoreUrl}
          style={{ height }}
          className="w-full border-0 rounded-lg shadow-sm bg-white"
          title="CogniCore Invoicing System"
          allow="clipboard-write; clipboard-read"
          onLoad={() => setIframeLoading(false)}
          onError={() => {
            setIframeLoading(false)
            setIframeError(true)
          }}
        />
      )}
    </div>
  )
}

