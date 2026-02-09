/**
 * Barcode Scanner Service
 * 
 * Mobile camera-based barcode scanning for inventory and stock taking
 * Uses html5-qrcode library for cross-platform camera access
 * 
 * Features:
 * - Mobile camera access
 * - Real-time barcode scanning
 * - Multiple format support
 * - Inventory counting
 * - Stock taking workflows
 */

import type { BarcodeFormat } from './types'

export interface ScanResult {
  success: boolean
  barcode?: string
  format?: BarcodeFormat
  timestamp?: Date
  error?: string
}

export interface ScannerConfig {
  fps?: number                    // Frames per second (default: 10)
  qrbox?: number | { width: number; height: number }  // Scanning box size
  aspectRatio?: number            // Camera aspect ratio
  disableFlip?: boolean           // Disable horizontal flip
  formatsToSupport?: BarcodeFormat[]  // Barcode formats to scan
}

export interface InventoryScanItem {
  barcode: string
  productId?: string
  productName?: string
  sku?: string
  quantity: number
  scannedAt: Date
}

/**
 * Barcode Scanner Class
 * Manages camera access and barcode detection
 */
export class BarcodeScanner {
  private html5QrCode: any = null
  private isScanning: boolean = false
  private onScanCallback: ((result: ScanResult) => void) | null = null

  /**
   * Initialize scanner
   */
  async initialize(elementId: string, config: ScannerConfig = {}): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Scanner can only be initialized on the client side')
    }

    // @ts-ignore - Html5Qrcode is loaded globally
    if (typeof Html5Qrcode === 'undefined') {
      throw new Error('Html5Qrcode library not loaded. Please include the library.')
    }

    try {
      // @ts-ignore
      this.html5QrCode = new Html5Qrcode(elementId)
    } catch (error) {
      throw new Error(`Failed to initialize scanner: ${error}`)
    }
  }

  /**
   * Start scanning
   */
  async start(
    onScan: (result: ScanResult) => void,
    config: ScannerConfig = {}
  ): Promise<void> {
    if (!this.html5QrCode) {
      throw new Error('Scanner not initialized. Call initialize() first.')
    }

    if (this.isScanning) {
      throw new Error('Scanner is already running')
    }

    this.onScanCallback = onScan

    const scannerConfig = {
      fps: config.fps || 10,
      qrbox: config.qrbox || 250,
      aspectRatio: config.aspectRatio || 1.0,
      disableFlip: config.disableFlip || false,
      formatsToSupport: config.formatsToSupport || [
        // @ts-ignore
        Html5QrcodeSupportedFormats.QR_CODE,
        // @ts-ignore
        Html5QrcodeSupportedFormats.CODE_128,
        // @ts-ignore
        Html5QrcodeSupportedFormats.CODE_39,
        // @ts-ignore
        Html5QrcodeSupportedFormats.EAN_13,
        // @ts-ignore
        Html5QrcodeSupportedFormats.EAN_8,
        // @ts-ignore
        Html5QrcodeSupportedFormats.UPC_A,
      ],
    }

    try {
      await this.html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        scannerConfig,
        (decodedText: string, decodedResult: any) => {
          this.handleScan(decodedText, decodedResult)
        },
        (errorMessage: string) => {
          // Scan error (usually just "no barcode found")
          // Don't call callback for every frame without a barcode
        }
      )

      this.isScanning = true
    } catch (error) {
      throw new Error(`Failed to start scanner: ${error}`)
    }
  }

  /**
   * Stop scanning
   */
  async stop(): Promise<void> {
    if (!this.html5QrCode || !this.isScanning) {
      return
    }

    try {
      await this.html5QrCode.stop()
      this.isScanning = false
      this.onScanCallback = null
    } catch (error) {
      console.error('Error stopping scanner:', error)
    }
  }

  /**
   * Handle successful scan
   */
  private handleScan(decodedText: string, decodedResult: any): void {
    if (!this.onScanCallback) return

    // Determine barcode format
    let format: BarcodeFormat = 'CODE128'
    if (decodedResult.result?.format) {
      const formatName = decodedResult.result.format.formatName || decodedResult.result.format
      format = this.mapFormat(formatName)
    }

    const result: ScanResult = {
      success: true,
      barcode: decodedText,
      format,
      timestamp: new Date(),
    }

    this.onScanCallback(result)
  }

  /**
   * Map html5-qrcode format to our BarcodeFormat
   */
  private mapFormat(formatName: string): BarcodeFormat {
    const formatMap: Record<string, BarcodeFormat> = {
      'QR_CODE': 'QR',
      'CODE_128': 'CODE128',
      'CODE_39': 'CODE39',
      'EAN_13': 'EAN13',
      'EAN_8': 'EAN8',
      'UPC_A': 'UPC',
      'UPC_E': 'UPC',
    }

    return formatMap[formatName] || 'CODE128'
  }

  /**
   * Check if scanner is currently running
   */
  isRunning(): boolean {
    return this.isScanning
  }

  /**
   * Get available cameras
   */
  static async getCameras(): Promise<Array<{ id: string; label: string }>> {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      // @ts-ignore
      const devices = await Html5Qrcode.getCameras()
      return devices.map((device: any) => ({
        id: device.id,
        label: device.label || `Camera ${device.id}`,
      }))
    } catch (error) {
      console.error('Error getting cameras:', error)
      return []
    }
  }
}

/**
 * Inventory Scanner
 * Manages stock taking workflow with barcode scanning
 */
export class InventoryScanner {
  private scannedItems: Map<string, InventoryScanItem> = new Map()
  private scanner: BarcodeScanner

  constructor() {
    this.scanner = new BarcodeScanner()
  }

  async initialize(elementId: string, config: ScannerConfig = {}): Promise<void> {
    await this.scanner.initialize(elementId, config)
  }

  async startStockTake(onItemScanned: (item: InventoryScanItem) => void): Promise<void> {
    await this.scanner.start(async (result) => {
      if (result.success && result.barcode) {
        await this.handleInventoryScan(result.barcode, onItemScanned)
      }
    })
  }

  async stop(): Promise<void> {
    await this.scanner.stop()
  }

  private async handleInventoryScan(
    barcode: string,
    callback: (item: InventoryScanItem) => void
  ): Promise<void> {
    // Check if already scanned
    const existing = this.scannedItems.get(barcode)

    if (existing) {
      // Increment quantity
      existing.quantity++
      existing.scannedAt = new Date()
      callback(existing)
    } else {
      // New item - look up product details
      const item: InventoryScanItem = {
        barcode,
        quantity: 1,
        scannedAt: new Date(),
      }

      // TODO: Look up product from database by barcode
      // For now, just add the barcode
      this.scannedItems.set(barcode, item)
      callback(item)
    }
  }

  getScannedItems(): InventoryScanItem[] {
    return Array.from(this.scannedItems.values())
  }

  clearScannedItems(): void {
    this.scannedItems.clear()
  }

  getTotalItemsScanned(): number {
    return Array.from(this.scannedItems.values()).reduce((sum, item) => sum + item.quantity, 0)
  }
}

