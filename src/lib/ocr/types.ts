/**
 * OCR Types and Interfaces
 * 
 * For invoice scanning and data extraction
 */

export interface OCRResult {
  success: boolean
  text?: string
  confidence?: number
  error?: string
  processingTimeMs?: number
}

export interface InvoiceData {
  supplierName?: string
  supplierAddress?: string
  supplierTaxNumber?: string
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  subtotal?: number
  tax?: number
  total?: number
  currency?: string
  items?: InvoiceLineItem[]
}

export interface InvoiceLineItem {
  description: string
  sku?: string
  quantity: number
  unitPrice: number
  total: number
}

export interface OCRExtractionResult {
  success: boolean
  invoiceData?: InvoiceData
  rawText?: string
  confidence?: number
  error?: string
}

export interface OCRConfig {
  language?: string // Default: 'eng'
  tesseractPath?: string
  workerPath?: string
  corePath?: string
  langPath?: string
}

export interface SupplierMatch {
  supplierId?: string
  supplierName: string
  confidence: number
  isNewSupplier: boolean
}

