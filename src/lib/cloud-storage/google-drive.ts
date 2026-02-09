/**
 * Google Drive Storage Provider
 * Stores tenant media in their own Google Drive account
 * 
 * Client owns their data - we just help them manage it.
 */

import {
  CloudStorageProvider,
  GoogleDriveCredentials,
  UploadParams,
  UploadResult,
  ListFilesParams,
  ListFilesResult,
  FileInfo,
  DeleteResult,
} from './types'

export class GoogleDriveProvider implements CloudStorageProvider {
  readonly providerName = 'Google Drive'
  
  private credentials: GoogleDriveCredentials
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private rootFolderId: string
  private baseUrl = 'https://www.googleapis.com'

  constructor(credentials: GoogleDriveCredentials, rootFolderId?: string) {
    this.credentials = credentials
    this.rootFolderId = rootFolderId || 'root'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: this.credentials.refreshToken,
        grant_type: 'refresh_token',
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
      const parentId = params.folder || this.rootFolderId

      // Create file metadata
      const metadata = {
        name: params.fileName,
        parents: [parentId],
        ...params.metadata,
      }

      // Use multipart upload
      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const fileContent = params.file instanceof Buffer 
        ? params.file.toString('base64')
        : await this.blobToBase64(params.file as Blob)

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${params.mimeType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileContent +
        closeDelimiter

      const response = await fetch(
        `${this.baseUrl}/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      )

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.error?.message || 'Upload failed' }
      }

      const file = await response.json()

      // Make file publicly accessible
      await this.makePublic(file.id, token)

      return {
        success: true,
        fileId: file.id,
        url: file.webViewLink,
        thumbnailUrl: file.thumbnailLink,
      }
    } catch (error) {
      return { success: false, error: `Google Drive upload failed: ${error}` }
    }
  }

  private async makePublic(fileId: string, token: string): Promise<void> {
    await fetch(`${this.baseUrl}/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    })
  }

  async listFiles(params?: ListFilesParams): Promise<ListFilesResult> {
    const token = await this.getAccessToken()
    const folderId = params?.folder || this.rootFolderId

    let query = `'${folderId}' in parents and trashed = false`
    if (params?.mimeType) {
      query += ` and mimeType contains '${params.mimeType.replace('*', '')}'`
    }

    const url = new URL(`${this.baseUrl}/drive/v3/files`)
    url.searchParams.set('q', query)
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime)')
    url.searchParams.set('pageSize', String(params?.limit || 50))
    if (params?.pageToken) url.searchParams.set('pageToken', params.pageToken)

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    const data = await response.json()

    return {
      files: (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: parseInt(f.size || '0'),
        url: f.webViewLink,
        thumbnailUrl: f.thumbnailLink,
        createdAt: f.createdTime,
        modifiedAt: f.modifiedTime,
      })),
      nextPageToken: data.nextPageToken,
    }
  }

  async getFile(fileId: string): Promise<FileInfo | null> {
    const token = await this.getAccessToken()
    const response = await fetch(
      `${this.baseUrl}/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,thumbnailLink,createdTime,modifiedTime`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    if (!response.ok) return null
    const f = await response.json()
    return {
      id: f.id, name: f.name, mimeType: f.mimeType, size: parseInt(f.size || '0'),
      url: f.webViewLink, thumbnailUrl: f.thumbnailLink, createdAt: f.createdTime, modifiedAt: f.modifiedTime,
    }
  }

  async deleteFile(fileId: string): Promise<DeleteResult> {
    const token = await this.getAccessToken()
    const response = await fetch(`${this.baseUrl}/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    return { success: response.ok, error: response.ok ? undefined : 'Delete failed' }
  }

  async createFolder(name: string, parentFolder?: string): Promise<{ folderId: string } | null> {
    const token = await this.getAccessToken()
    const response = await fetch(`${this.baseUrl}/drive/v3/files`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolder || this.rootFolderId],
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return { folderId: data.id }
  }

  async getShareableUrl(fileId: string): Promise<string | null> {
    const file = await this.getFile(fileId)
    return file?.url || null
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  }
}

