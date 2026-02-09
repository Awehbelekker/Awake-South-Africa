/**
 * Cloud Storage Module
 * 
 * Provides unified interface for tenant cloud storage (Google Drive, OneDrive).
 * Each tenant's media is stored in THEIR account - they own their data.
 * 
 * Usage for uploading a file:
 * ```typescript
 * import { uploadTenantFile } from '@/lib/cloud-storage'
 * 
 * const result = await uploadTenantFile(tenantId, {
 *   file: imageBuffer,
 *   fileName: 'product-image.jpg',
 *   mimeType: 'image/jpeg',
 *   folder: 'products', // Optional subfolder
 * })
 * 
 * if (result.success) {
 *   console.log('Uploaded to:', result.url)
 * }
 * ```
 * 
 * For Master Admin - checking storage status:
 * ```typescript
 * import { getTenantStorageInfo } from '@/lib/cloud-storage'
 * 
 * const info = await getTenantStorageInfo(tenantId)
 * // { configured: true, provider: 'Google Drive', folderId: '...' }
 * ```
 */

// Types
export type {
  CloudStorageConfig,
  GoogleDriveCredentials,
  OneDriveCredentials,
  UploadParams,
  UploadResult,
  FileInfo,
  ListFilesParams,
  ListFilesResult,
  DeleteResult,
} from './types'

export { STORAGE_PROVIDER_INFO } from './types'

// Tenant Storage Service (main entry point)
export {
  getTenantStorageProvider,
  uploadTenantFile,
  listTenantFiles,
  getTenantFile,
  deleteTenantFile,
  hasTenantStorage,
  getTenantStorageInfo,
} from './tenant-storage-service'

// Individual Providers (for advanced usage)
export { GoogleDriveProvider } from './google-drive'
export { OneDriveProvider } from './onedrive'

