/**
 * Cloud Data Sync Service
 * 
 * Syncs application data (invoices, customers, products) to cloud storage
 * Ported from Aweh Be Lekker Invoicing System with multi-tenant support
 * 
 * Features:
 * - Automatic sync to Google Drive/OneDrive
 * - Offline fallback to database
 * - Sync queue for offline changes
 * - Per-tenant data isolation
 */

import { createClient } from '@/lib/supabase/client'
import { GoogleDriveProvider } from './google-drive'
import { OneDriveProvider } from './onedrive'
import { GoogleDriveCredentials, OneDriveCredentials } from './types'

export interface SyncQueueItem {
  id: string
  tenantId: string
  action: 'save' | 'delete'
  dataKey: string
  data?: any
  createdAt: Date
  retryCount: number
}

export interface SyncStatus {
  isOnline: boolean
  isConfigured: boolean
  lastSyncTime?: Date
  queueLength: number
  provider?: 'google_drive' | 'onedrive'
}

export class CloudDataSyncService {
  private tenantId: string
  private provider: GoogleDriveProvider | OneDriveProvider | null = null
  private syncQueue: SyncQueueItem[] = []
  private isOnline: boolean = true
  private folderId: string | null = null
  private folderName = 'Awake Store Data'

  constructor(tenantId: string) {
    this.tenantId = tenantId
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    // Listen for online/offline events (client-side only)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
    }
  }

  /**
   * Initialize cloud storage provider for this tenant
   */
  async initialize(): Promise<boolean> {
    try {
      const supabase = createClient()
      
      // Get tenant's cloud storage configuration
      const { data: config, error } = await supabase
        .from('tenant_cloud_storage')
        .select('*')
        .eq('tenant_id', this.tenantId)
        .eq('is_enabled', true)
        .single()

      if (error || !config) {
        console.log('No cloud storage configured for tenant:', this.tenantId)
        return false
      }

      // Initialize provider
      if (config.provider === 'google_drive') {
        this.provider = new GoogleDriveProvider(
          config.credentials as GoogleDriveCredentials,
          config.folder_id
        )
      } else if (config.provider === 'onedrive') {
        this.provider = new OneDriveProvider(
          config.credentials as OneDriveCredentials,
          config.folder_id
        )
      }

      // Ensure data folder exists
      if (this.provider) {
        const folder = await this.provider.createFolder(this.folderName)
        if (folder) {
          this.folderId = folder.folderId
          
          // Update folder ID in database
          await supabase
            .from('tenant_cloud_storage')
            .update({ folder_id: this.folderId })
            .eq('tenant_id', this.tenantId)
        }
      }

      return true
    } catch (error) {
      console.error('Error initializing cloud sync:', error)
      return false
    }
  }

  /**
   * Save data to cloud storage (with database fallback)
   * Similar to driveStorage.setItem() from Aweh Be Lekker repo
   */
  async setItem(key: string, value: any): Promise<boolean> {
    const filename = `${key}.json`
    const supabase = createClient()

    // Always save to database first (instant, works offline)
    try {
      await supabase
        .from('tenant_data_sync')
        .upsert({
          tenant_id: this.tenantId,
          data_key: key,
          data: value,
          updated_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Database save error:', error)
    }

    // Try to sync to cloud if online and configured
    if (this.isOnline && this.provider && this.folderId) {
      try {
        // Check if file exists
        const files = await this.provider.listFiles({ folder: this.folderId })
        const existingFile = files.files.find(f => f.name === filename)

        const content = JSON.stringify(value, null, 2)
        const buffer = Buffer.from(content, 'utf-8')

        if (existingFile) {
          // Update existing file
          await this.provider.upload({
            file: buffer,
            fileName: filename,
            mimeType: 'application/json',
            folder: this.folderId,
          })
        } else {
          // Create new file
          await this.provider.upload({
            file: buffer,
            fileName: filename,
            mimeType: 'application/json',
            folder: this.folderId,
          })
        }

        return true
      } catch (error) {
        console.error('Cloud sync error:', error)
        
        // Add to sync queue
        this.addToSyncQueue('save', key, value)
        return false
      }
    } else {
      // Offline or not configured - add to sync queue
      this.addToSyncQueue('save', key, value)
      return false
    }
  }

  /**
   * Load data from cloud storage (with database fallback)
   * Similar to driveStorage.getItem() from Aweh Be Lekker repo
   */
  async getItem<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
    const filename = `${key}.json`
    const supabase = createClient()

    // Try cloud storage first if online and configured
    if (this.isOnline && this.provider && this.folderId) {
      try {
        const files = await this.provider.listFiles({ folder: this.folderId })
        const file = files.files.find(f => f.name === filename)

        if (file) {
          // Download file content
          const response = await fetch(file.url)
          const content = await response.text()
          const data = JSON.parse(content)

          // Update database cache
          await supabase
            .from('tenant_data_sync')
            .upsert({
              tenant_id: this.tenantId,
              data_key: key,
              data,
              updated_at: new Date().toISOString(),
            })

          return data
        }
      } catch (error) {
        console.error('Error loading from cloud:', error)
      }
    }

    // Fallback to database
    try {
      const { data, error } = await supabase
        .from('tenant_data_sync')
        .select('data')
        .eq('tenant_id', this.tenantId)
        .eq('data_key', key)
        .single()

      return data?.data || defaultValue
    } catch (error) {
      console.error('Database load error:', error)
      return defaultValue
    }
  }

  /**
   * Remove item from cloud and database
   */
  async removeItem(key: string): Promise<void> {
    const filename = `${key}.json`
    const supabase = createClient()

    // Remove from database
    await supabase
      .from('tenant_data_sync')
      .delete()
      .eq('tenant_id', this.tenantId)
      .eq('data_key', key)

    // Remove from cloud if configured
    if (this.provider && this.folderId) {
      try {
        const files = await this.provider.listFiles({ folder: this.folderId })
        const file = files.files.find(f => f.name === filename)

        if (file) {
          await this.provider.deleteFile(file.id)
        }
      } catch (error) {
        console.error('Error removing from cloud:', error)
      }
    }
  }

  /**
   * Sync all data to cloud storage
   */
  async syncAll(): Promise<number> {
    if (!this.provider || !this.folderId) {
      return 0
    }

    const supabase = createClient()

    // Get all data for this tenant
    const { data: items, error } = await supabase
      .from('tenant_data_sync')
      .select('*')
      .eq('tenant_id', this.tenantId)

    if (error || !items) {
      return 0
    }

    let syncedCount = 0

    for (const item of items) {
      try {
        await this.setItem(item.data_key, item.data)
        syncedCount++
      } catch (error) {
        console.error(`Error syncing ${item.data_key}:`, error)
      }
    }

    return syncedCount
  }

  /**
   * Add item to sync queue
   */
  private addToSyncQueue(action: 'save' | 'delete', key: string, data?: any): void {
    this.syncQueue.push({
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      action,
      dataKey: key,
      data,
      createdAt: new Date(),
      retryCount: 0,
    })
  }

  /**
   * Process sync queue (when back online)
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return

    const queue = [...this.syncQueue]
    this.syncQueue = []

    for (const item of queue) {
      try {
        if (item.action === 'save') {
          await this.setItem(item.dataKey, item.data)
        } else if (item.action === 'delete') {
          await this.removeItem(item.dataKey)
        }
      } catch (error) {
        console.error('Error processing sync queue item:', error)

        // Re-add to queue if retry count < 3
        if (item.retryCount < 3) {
          item.retryCount++
          this.syncQueue.push(item)
        }
      }
    }
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    this.isOnline = true
    console.log('Back online - processing sync queue')
    await this.processSyncQueue()
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false
    console.log('Gone offline - queuing changes')
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const supabase = createClient()

    const { data: config } = await supabase
      .from('tenant_cloud_storage')
      .select('provider, last_sync_time')
      .eq('tenant_id', this.tenantId)
      .eq('is_enabled', true)
      .single()

    return {
      isOnline: this.isOnline,
      isConfigured: !!this.provider,
      lastSyncTime: config?.last_sync_time ? new Date(config.last_sync_time) : undefined,
      queueLength: this.syncQueue.length,
      provider: config?.provider,
    }
  }
}

