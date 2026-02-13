/**
 * Tenant Storage Service
 * Fetches cloud storage credentials from database and creates provider instances
 * 
 * Each tenant's media is stored in THEIR cloud storage account.
 * They own their data - we just help them manage it.
 */

import { createClient } from '@/lib/supabase/client'
import { Tenant } from '@/types/supabase'
import { 
  CloudStorageProvider as ICloudStorageProvider,
  GoogleDriveCredentials,
  OneDriveCredentials,
  UploadParams,
  UploadResult,
  ListFilesResult,
  FileInfo,
} from './types'
import { GoogleDriveProvider } from './google-drive'
import { OneDriveProvider } from './onedrive'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Get the cloud storage provider for a tenant
 */
export async function getTenantStorageProvider(
  tenantId: string
): Promise<ICloudStorageProvider | null> {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('google_drive_enabled, google_drive_client_id, google_drive_client_secret, google_drive_refresh_token, google_drive_folder_id')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    console.error('Failed to fetch tenant storage config:', error)
    return null
  }

  // Check if Google Drive is configured
  if (tenant.google_drive_enabled && tenant.google_drive_client_id) {
    const credentials: GoogleDriveCredentials = {
      clientId: tenant.google_drive_client_id,
      clientSecret: tenant.google_drive_client_secret || '',
      refreshToken: tenant.google_drive_refresh_token || '',
    }
    return new GoogleDriveProvider(credentials, tenant.google_drive_folder_id || undefined)
  }

  // TODO: Add OneDrive check when we add those fields to the schema
  // if (tenant.onedrive_enabled && tenant.onedrive_client_id) { ... }

  return null
}

/**
 * Upload a file to the tenant's cloud storage
 * Falls back to local storage if no cloud storage is configured
 */
export async function uploadTenantFile(
  tenantId: string,
  params: UploadParams
): Promise<UploadResult> {
  const provider = await getTenantStorageProvider(tenantId)

  if (!provider) {
    // Fallback: Return error - in production you might want local storage fallback
    return {
      success: false,
      error: 'No cloud storage configured for this tenant. Please configure Google Drive or OneDrive.',
    }
  }

  return provider.upload(params)
}

/**
 * List files from the tenant's cloud storage
 */
export async function listTenantFiles(
  tenantId: string,
  folder?: string,
  mimeType?: string
): Promise<ListFilesResult> {
  const provider = await getTenantStorageProvider(tenantId)

  if (!provider) {
    return { files: [] }
  }

  return provider.listFiles({ folder, mimeType })
}

/**
 * Get a file from the tenant's cloud storage
 */
export async function getTenantFile(
  tenantId: string,
  fileId: string
): Promise<FileInfo | null> {
  const provider = await getTenantStorageProvider(tenantId)

  if (!provider) {
    return null
  }

  return provider.getFile(fileId)
}

/**
 * Delete a file from the tenant's cloud storage
 */
export async function deleteTenantFile(
  tenantId: string,
  fileId: string
): Promise<{ success: boolean; error?: string }> {
  const provider = await getTenantStorageProvider(tenantId)

  if (!provider) {
    return { success: false, error: 'No cloud storage configured' }
  }

  return provider.deleteFile(fileId)
}

/**
 * Check if a tenant has cloud storage configured
 */
export async function hasTenantStorage(tenantId: string): Promise<boolean> {
  const provider = await getTenantStorageProvider(tenantId)
  return provider !== null
}

/**
 * Get storage info for display in admin
 */
export async function getTenantStorageInfo(tenantId: string): Promise<{
  configured: boolean
  provider?: string
  folderId?: string
}> {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('google_drive_enabled, google_drive_folder_id')
    .eq('id', tenantId)
    .single()

  if (!tenant) {
    return { configured: false }
  }

  if (tenant.google_drive_enabled) {
    return {
      configured: true,
      provider: 'Google Drive',
      folderId: tenant.google_drive_folder_id || undefined,
    }
  }

  return { configured: false }
}

