/**
 * Unified Google Drive Hook
 * 
 * Provides Google Drive connection status and functionality
 * across all admin pages - "connect once, use everywhere"
 */

import { useState, useEffect, useCallback } from 'react'
import { useTenant } from '@/contexts/TenantContext'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  thumbnailLink?: string
  webViewLink?: string
}

interface DriveFolder {
  id: string
  name: string
}

interface BreadcrumbItem {
  id: string
  name: string
}

interface BrowseResult {
  folderPath: BreadcrumbItem[]
  folders: DriveFolder[]
  files: DriveFile[]
}

interface TransferResult {
  success: Array<{
    fileId: string
    fileName: string
    url: string
    productId?: string
  }>
  errors: Array<{
    fileId?: string
    file?: string
    error: string
  }>
}

export function useGoogleDrive() {
  const { tenant } = useTenant()
  const [isConnected, setIsConnected] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check connection status
  const checkConnection = useCallback(async () => {
    if (!tenant?.id) {
      setIsConnected(false)
      setChecking(false)
      return
    }

    try {
      // Try to browse root folder - if it works, we're connected
      const response = await fetch(
        `/api/tenant/google-drive/browse?tenant_id=${tenant.id}&folder_id=root`
      )
      setIsConnected(response.ok)
    } catch (err) {
      setIsConnected(false)
    } finally {
      setChecking(false)
    }
  }, [tenant?.id])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Initiate OAuth connection
  const connect = useCallback(() => {
    if (!tenant?.id) {
      throw new Error('No tenant available')
    }

    // Open OAuth flow in popup or current window
    const authUrl = `/api/oauth/google/authorize?tenant_id=${tenant.id}`
    
    // Open in popup for better UX
    const popup = window.open(
      authUrl,
      'google-drive-auth',
      'width=600,height=700,scrollbars=yes'
    )

    // Listen for popup close or message
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup)
        // Recheck connection status after popup closes
        setTimeout(() => checkConnection(), 1000)
      }
    }, 500)

    return popup
  }, [tenant?.id, checkConnection])

  // Disconnect (clear OAuth tokens)
  const disconnect = useCallback(async () => {
    if (!tenant?.id) return

    try {
      const response = await fetch(
        `/api/tenant/google-drive/disconnect?tenant_id=${tenant.id}`,
        { method: 'POST' }
      )

      if (response.ok) {
        setIsConnected(false)
      }
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }, [tenant?.id])

  // Browse folder
  const browseFolder = useCallback(async (folderId: string = 'root'): Promise<BrowseResult> => {
    if (!tenant?.id) {
      throw new Error('No tenant available')
    }

    const response = await fetch(
      `/api/tenant/google-drive/browse?tenant_id=${tenant.id}&folder_id=${folderId}`
    )
    
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to browse folder')
    }

    return {
      folderPath: data.folderPath || [],
      folders: data.folders || [],
      files: data.files || [],
    }
  }, [tenant?.id])

  // Transfer files to Supabase
  const transferToSupabase = useCallback(async (
    fileIds: string[],
    options?: {
      createProducts?: boolean
      category?: string
    }
  ): Promise<TransferResult> => {
    if (!tenant?.id) {
      throw new Error('No tenant available')
    }

    const response = await fetch(
      `/api/tenant/google-drive/transfer?tenant_id=${tenant.id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds,
          createProducts: options?.createProducts ?? false,
          category: options?.category ?? 'uncategorized',
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Transfer failed')
    }

    return {
      success: data.success || [],
      errors: data.errors || [],
    }
  }, [tenant?.id])

  return {
    isConnected,
    checking,
    connect,
    disconnect,
    browseFolder,
    transferToSupabase,
    checkConnection, // Allow manual refresh
  }
}
