/**
 * Barcode Types and Interfaces
 * 
 * Supports multiple barcode formats for product inventory management
 */

export type BarcodeFormat = 
  | 'EAN13'      // European Article Number (13 digits) - Most common for retail
  | 'EAN8'       // European Article Number (8 digits) - Compact version
  | 'CODE128'    // Code 128 - Alphanumeric, high density
  | 'CODE39'     // Code 39 - Alphanumeric, widely supported
  | 'UPC'        // Universal Product Code (12 digits) - North America
  | 'QR'         // QR Code - 2D barcode, can store URLs and data

export interface BarcodeOptions {
  format: BarcodeFormat
  width?: number          // Width of barcode in pixels
  height?: number         // Height of barcode in pixels
  displayValue?: boolean  // Show human-readable text below barcode
  fontSize?: number       // Font size for text
  margin?: number         // Margin around barcode
  background?: string     // Background color
  lineColor?: string      // Barcode line color
}

export interface BarcodeGenerationResult {
  success: boolean
  barcode?: string        // The barcode value
  format?: BarcodeFormat
  dataUrl?: string        // Base64 data URL of barcode image
  svg?: string            // SVG representation
  error?: string
}

export interface ProductBarcode {
  id: string
  productId: string
  tenantId: string
  barcode: string
  format: BarcodeFormat
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BarcodePrintOptions {
  productIds: string[]
  format: BarcodeFormat
  includeProductName?: boolean
  includePrice?: boolean
  includeSKU?: boolean
  labelsPerRow?: number
  labelWidth?: number    // in mm
  labelHeight?: number   // in mm
}

export interface BarcodeValidationResult {
  isValid: boolean
  format?: BarcodeFormat
  error?: string
}

