/**
 * OneDrive Storage Provider
 * Stores tenant media in their own OneDrive/SharePoint account
 * 
 * Supports both personal and business OneDrive accounts.
 */

import {
  CloudStorageProvider,
  OneDriveCredentials,
  UploadParams,
  UploadResult,
  ListFilesParams,
  ListFilesResult,
  FileInfo,
  DeleteResult,
} from './types'

export class OneDriveProvider implements CloudStorageProvider {
  readonly providerName = 'OneDrive'
  
  private credentials: OneDriveCredentials
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private rootFolderId: string
  private baseUrl = 'https://graph.microsoft.com/v1.0'

  constructor(credentials: OneDriveCredentials, rootFolderId?: string) {
    this.credentials = credentials
    this.rootFolderId = rootFolderId || 'root'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const tokenUrl = this.credentials.tenantId
      ? `https://login.microsoftonline.com/${this.credentials.tenantId}/oauth2/v2.0/token`
      : 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: this.credentials.refreshToken,
        grant_type: 'refresh_token',
        scope: 'Files.ReadWrite.All offline_access',
      }),
    })

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken!
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    try {
      const token = await this.getAccessToken()
      const parentPath = params.folder 
        ? `/me/drive/items/${params.folder}` 
        : `/me/drive/items/${this.rootFolderId}`

      // For files < 4MB, use simple upload
      const fileBuffer = params.file instanceof Buffer 
        ? new Uint8Array(params.file) 
        : new Uint8Array(await (params.file as Blob).arrayBuffer())

      const response = await fetch(
        `${this.baseUrl}${parentPath}:/${encodeURIComponent(params.fileName)}:/content`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': params.mimeType,
          },
          body: fileBuffer,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error?.message || 'Upload failed' }
      }

      const file = await response.json()

      // Create sharing link
      const shareUrl = await this.createSharingLink(file.id, token)

      return {
        success: true,
        fileId: file.id,
        url: shareUrl || file.webUrl,
        thumbnailUrl: file.thumbnails?.[0]?.medium?.url,
      }
    } catch (error) {
      return { success: false, error: `OneDrive upload failed: ${error}` }
    }
  }

  private async createSharingLink(fileId: string, token: string): Promise<string | null> {
    const response = await fetch(
      `${this.baseUrl}/me/drive/items/${fileId}/createLink`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'view', scope: 'anonymous' }),
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.link?.webUrl || null
  }

  async listFiles(params?: ListFilesParams): Promise<ListFilesResult> {
    const token = await this.getAccessToken()
    const folderId = params?.folder || this.rootFolderId

    const url = new URL(`${this.baseUrl}/me/drive/items/${folderId}/children`)
    url.searchParams.set('$top', String(params?.limit || 50))
    url.searchParams.set('$select', 'id,name,file,size,webUrl,createdDateTime,lastModifiedDateTime,thumbnails')
    if (params?.pageToken) url.searchParams.set('$skiptoken', params.pageToken)

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    const data = await response.json()

    let files = (data.value || []).filter((f: any) => f.file) // Only files, not folders
    
    if (params?.mimeType) {
      const mimePrefix = params.mimeType.replace('*', '')
      files = files.filter((f: any) => f.file?.mimeType?.startsWith(mimePrefix))
    }

    return {
      files: files.map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.file?.mimeType || 'application/octet-stream',
        size: f.size || 0,
        url: f.webUrl,
        thumbnailUrl: f.thumbnails?.[0]?.medium?.url,
        createdAt: f.createdDateTime,
        modifiedAt: f.lastModifiedDateTime,
      })),
      nextPageToken: data['@odata.nextLink']?.split('$skiptoken=')[1],
    }
  }

  async getFile(fileId: string): Promise<FileInfo | null> {
    const token = await this.getAccessToken()
    const response = await fetch(
      `${this.baseUrl}/me/drive/items/${fileId}?$select=id,name,file,size,webUrl,createdDateTime,lastModifiedDateTime`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) return null
    const f = await response.json()
    return {
      id: f.id, name: f.name, mimeType: f.file?.mimeType || 'application/octet-stream',
      size: f.size || 0, url: f.webUrl, createdAt: f.createdDateTime, modifiedAt: f.lastModifiedDateTime,
    }
  }

  async deleteFile(fileId: string): Promise<DeleteResult> {
    const token = await this.getAccessToken()
    const response = await fetch(`${this.baseUrl}/me/drive/items/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return { success: response.status === 204, error: response.ok ? undefined : 'Delete failed' }
  }

  async createFolder(name: string, parentFolder?: string): Promise<{ folderId: string } | null> {
    const token = await this.getAccessToken()
    const parentId = parentFolder || this.rootFolderId
    const response = await fetch(`${this.baseUrl}/me/drive/items/${parentId}/children`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return { folderId: data.id }
  }

  async getShareableUrl(fileId: string): Promise<string | null> {
    const token = await this.getAccessToken()
    return this.createSharingLink(fileId, token)
  }
}

