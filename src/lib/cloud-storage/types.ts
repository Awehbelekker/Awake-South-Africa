/**
 * Cloud Storage Abstraction Layer
 * Unified interface for Google Drive and OneDrive
 * 
 * Each tenant can have their own cloud storage - their data, their ownership.
 */

export type CloudStorageProvider = 'google_drive' | 'onedrive' | 'local'

export interface CloudStorageConfig {
  provider: CloudStorageProvider
  credentials: GoogleDriveCredentials | OneDriveCredentials
  folderId?: string // Root folder for this tenant's files
}

export interface GoogleDriveCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

export interface OneDriveCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
  tenantId?: string // For business accounts
}

export interface UploadParams {
  file: Buffer | Blob
  fileName: string
  mimeType: string
  folder?: string // Subfolder within tenant's root folder
  metadata?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  fileId?: string
  url?: string // Public or shareable URL
  thumbnailUrl?: string
  error?: string
}

export interface FileInfo {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  createdAt: string
  modifiedAt: string
  folder?: string
}

export interface ListFilesParams {
  folder?: string
  mimeType?: string // Filter by type (e.g., 'image/*')
  limit?: number
  pageToken?: string
}

export interface ListFilesResult {
  files: FileInfo[]
  nextPageToken?: string
  totalCount?: number
}

export interface DeleteResult {
  success: boolean
  error?: string
}

/**
 * Cloud Storage Provider Interface
 * All providers (Google Drive, OneDrive) implement this interface
 */
export interface CloudStorageProvider {
  readonly providerName: string
  
  /**
   * Upload a file to the tenant's cloud storage
   */
  upload(params: UploadParams): Promise<UploadResult>
  
  /**
   * List files in the tenant's storage
   */
  listFiles(params?: ListFilesParams): Promise<ListFilesResult>
  
  /**
   * Get a single file's info and URL
   */
  getFile(fileId: string): Promise<FileInfo | null>
  
  /**
   * Delete a file
   */
  deleteFile(fileId: string): Promise<DeleteResult>
  
  /**
   * Create a folder
   */
  createFolder(name: string, parentFolder?: string): Promise<{ folderId: string } | null>
  
  /**
   * Get a shareable/public URL for a file
   */
  getShareableUrl(fileId: string): Promise<string | null>
}

/**
 * Provider-specific required fields for Master Admin UI
 */
export const STORAGE_PROVIDER_INFO: Record<'google_drive' | 'onedrive', {
  name: string
  description: string
  logo: string
  requiredFields: { key: string; label: string; type: 'text' | 'password'; help?: string }[]
  oauthUrl?: string
}> = {
  google_drive: {
    name: 'Google Drive',
    description: "Store media in client's Google Drive - they own their data",
    logo: '/images/storage/google-drive.png',
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', help: 'From Google Cloud Console' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', help: 'Generated via OAuth flow' },
    ],
  },
  onedrive: {
    name: 'OneDrive',
    description: "Store media in client's OneDrive/SharePoint",
    logo: '/images/storage/onedrive.png',
    requiredFields: [
      { key: 'clientId', label: 'Application ID', type: 'text', help: 'From Azure Portal' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
      { key: 'tenantId', label: 'Tenant ID (Business)', type: 'text', help: 'Optional - for business accounts' },
    ],
  },
}

