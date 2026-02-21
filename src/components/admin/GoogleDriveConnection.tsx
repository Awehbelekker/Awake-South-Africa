'use client'

/**
 * Google Drive Connection Component
 * 
 * Shows Google Drive connection status and provides OAuth link
 * Used in admin settings for tenant to connect their Drive
 */

import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'

interface GoogleDriveStatus {
  connected: boolean
  lastSync?: string
  folderId?: string
}

export function GoogleDriveConnection() {
  const { tenant } = useTenant()
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check URL params for OAuth callback status
    const params = new URLSearchParams(window.location.search)
    const googleDriveStatus = params.get('google_drive')
    const oauthError = params.get('error')
    const errorMessage = params.get('message')

    if (googleDriveStatus === 'connected') {
      setError(null)
      // Reload status
      loadStatus()
      // Clean URL
      window.history.replaceState({}, '', '/admin/settings')
    } else if (oauthError) {
      setError(`Connection failed: ${errorMessage || oauthError}`)
      // Clean URL
      window.history.replaceState({}, '', '/admin/settings')
    } else {
      loadStatus()
    }
  }, [])

  async function loadStatus() {
    if (!tenant?.id) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/tenant/google-drive/status?tenant_id=${tenant.id}`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (err: any) {
      console.error('Failed to load Google Drive status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!tenant?.id) {
      setError('Tenant not loaded. Please refresh the page and try again.')
      return
    }

    // Redirect to OAuth flow
    window.location.href = `/api/oauth/google/authorize?tenant_id=${tenant.id}`
  }

  async function handleDisconnect() {
    if (!tenant?.id || !confirm('Disconnect Google Drive? You can reconnect anytime.')) {
      return
    }

    try {
      const response = await fetch(`/api/tenant/google-drive/disconnect?tenant_id=${tenant.id}`, {
        method: 'POST'
      })

      if (response.ok) {
        setStatus({ connected: false })
        setError(null)
      } else {
        setError('Failed to disconnect')
      }
    } catch (err) {
      setError('Failed to disconnect')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Drive Integration
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Connect your Google Drive to sync product images automatically
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {status?.connected ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-900">Connected</h4>
                <p className="mt-1 text-sm text-green-700">
                  Your Google Drive is connected and ready to sync
                </p>
                {status.lastSync && (
                  <p className="mt-1 text-xs text-green-600">
                    Last synced: {new Date(status.lastSync).toLocaleString()}
                  </p>
                )}
                {status.folderId && (
                  <p className="mt-1 text-xs text-green-600">
                    Folder ID: {status.folderId}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Not Connected</h4>
              <p className="mt-1 text-sm text-gray-600">
                Connect your Google Drive to enable product image sync
              </p>
            </div>
            <button
              onClick={handleConnect}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm"
            >
              Connect Drive
            </button>
          </div>
        </div>
      )}

      {status?.connected && (
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Sync product images from your Drive folder</li>
            <li>Auto-upload new product images</li>
            <li>One-click bulk import from Drive</li>
          </ul>
        </div>
      )}
    </div>
  )
}
