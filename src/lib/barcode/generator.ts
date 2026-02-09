/**
 * Barcode Generator Service
 * 
 * Generates barcodes for products using JsBarcode library
 * Supports multiple formats: EAN13, CODE128, QR codes, etc.
 * 
 * Features:
 * - Auto-generate barcodes from SKU
 * - Multiple barcode formats
 * - SVG and PNG output
 * - Batch generation
 * - Print-ready labels
 */

import { createClient } from '@/lib/supabase/client'
import type {
  BarcodeFormat,
  BarcodeOptions,
  BarcodeGenerationResult,
  BarcodeValidationResult,
} from './types'

/**
 * Generate a barcode from a value
 * Uses JsBarcode library (client-side only)
 */
export function generateBarcode(
  value: string,
  options: BarcodeOptions = { format: 'CODE128' }
): BarcodeGenerationResult {
  // This function should be called client-side only
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Barcode generation is only available on the client side',
    }
  }

  try {
    // Create a canvas element
    const canvas = document.createElement('canvas')
    
    // Import JsBarcode dynamically (will be loaded via CDN or npm)
    // @ts-ignore - JsBarcode is loaded globally
    if (typeof JsBarcode === 'undefined') {
      return {
        success: false,
        error: 'JsBarcode library not loaded. Please include the library.',
      }
    }

    // Generate barcode
    // @ts-ignore
    JsBarcode(canvas, value, {
      format: options.format,
      width: options.width || 2,
      height: options.height || 100,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 14,
      margin: options.margin || 10,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
    })

    // Get data URL
    const dataUrl = canvas.toDataURL('image/png')

    return {
      success: true,
      barcode: value,
      format: options.format,
      dataUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate barcode',
    }
  }
}

/**
 * Generate SVG barcode (better for printing)
 */
export function generateBarcodeSVG(
  value: string,
  options: BarcodeOptions = { format: 'CODE128' }
): BarcodeGenerationResult {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'Barcode generation is only available on the client side',
    }
  }

  try {
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    
    // @ts-ignore
    if (typeof JsBarcode === 'undefined') {
      return {
        success: false,
        error: 'JsBarcode library not loaded',
      }
    }

    // Generate barcode
    // @ts-ignore
    JsBarcode(svg, value, {
      format: options.format,
      width: options.width || 2,
      height: options.height || 100,
      displayValue: options.displayValue !== false,
      fontSize: options.fontSize || 14,
      margin: options.margin || 10,
      background: options.background || '#ffffff',
      lineColor: options.lineColor || '#000000',
    })

    // Get SVG string
    const svgString = new XMLSerializer().serializeToString(svg)

    return {
      success: true,
      barcode: value,
      format: options.format,
      svg: svgString,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate barcode SVG',
    }
  }
}

/**
 * Auto-generate barcode from product SKU
 * Converts SKU to barcode-compatible format
 */
export function generateBarcodeFromSKU(sku: string, format: BarcodeFormat = 'CODE128'): string {
  // Remove special characters and spaces
  let barcode = sku.replace(/[^A-Z0-9]/gi, '').toUpperCase()

  // Format-specific processing
  if (format === 'EAN13') {
    // EAN13 requires exactly 13 digits
    // Pad with zeros if needed
    barcode = barcode.replace(/[^0-9]/g, '') // Only digits
    if (barcode.length < 12) {
      barcode = barcode.padStart(12, '0')
    } else if (barcode.length > 12) {
      barcode = barcode.substring(0, 12)
    }
    // Calculate check digit
    barcode = barcode + calculateEAN13CheckDigit(barcode)
  } else if (format === 'EAN8') {
    // EAN8 requires exactly 8 digits
    barcode = barcode.replace(/[^0-9]/g, '')
    if (barcode.length < 7) {
      barcode = barcode.padStart(7, '0')
    } else if (barcode.length > 7) {
      barcode = barcode.substring(0, 7)
    }
    barcode = barcode + calculateEAN8CheckDigit(barcode)
  } else if (format === 'UPC') {
    // UPC requires exactly 12 digits
    barcode = barcode.replace(/[^0-9]/g, '')
    if (barcode.length < 11) {
      barcode = barcode.padStart(11, '0')
    } else if (barcode.length > 11) {
      barcode = barcode.substring(0, 11)
    }
    barcode = barcode + calculateUPCCheckDigit(barcode)
  }

  return barcode
}

/**
 * Calculate EAN13 check digit
 */
function calculateEAN13CheckDigit(barcode: string): string {
  const digits = barcode.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

/**
 * Calculate EAN8 check digit
 */
function calculateEAN8CheckDigit(barcode: string): string {
  const digits = barcode.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

/**
 * Calculate UPC check digit
 */
function calculateUPCCheckDigit(barcode: string): string {
  return calculateEAN13CheckDigit(barcode) // Same algorithm
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string, format: BarcodeFormat): BarcodeValidationResult {
  switch (format) {
    case 'EAN13':
      if (!/^\d{13}$/.test(barcode)) {
        return { isValid: false, error: 'EAN13 must be exactly 13 digits' }
      }
      // Validate check digit
      const ean13Check = calculateEAN13CheckDigit(barcode.substring(0, 12))
      if (barcode[12] !== ean13Check) {
        return { isValid: false, error: 'Invalid EAN13 check digit' }
      }
      return { isValid: true, format: 'EAN13' }

    case 'EAN8':
      if (!/^\d{8}$/.test(barcode)) {
        return { isValid: false, error: 'EAN8 must be exactly 8 digits' }
      }
      const ean8Check = calculateEAN8CheckDigit(barcode.substring(0, 7))
      if (barcode[7] !== ean8Check) {
        return { isValid: false, error: 'Invalid EAN8 check digit' }
      }
      return { isValid: true, format: 'EAN8' }

    case 'UPC':
      if (!/^\d{12}$/.test(barcode)) {
        return { isValid: false, error: 'UPC must be exactly 12 digits' }
      }
      const upcCheck = calculateUPCCheckDigit(barcode.substring(0, 11))
      if (barcode[11] !== upcCheck) {
        return { isValid: false, error: 'Invalid UPC check digit' }
      }
      return { isValid: true, format: 'UPC' }

    case 'CODE128':
      if (barcode.length === 0) {
        return { isValid: false, error: 'CODE128 cannot be empty' }
      }
      // CODE128 supports alphanumeric
      return { isValid: true, format: 'CODE128' }

    case 'CODE39':
      if (!/^[A-Z0-9\-. $/+%]+$/.test(barcode)) {
        return { isValid: false, error: 'CODE39 supports only uppercase letters, digits, and special characters' }
      }
      return { isValid: true, format: 'CODE39' }

    case 'QR':
      // QR codes can contain any data
      return { isValid: true, format: 'QR' }

    default:
      return { isValid: false, error: 'Unknown barcode format' }
  }
}

/**
 * Save barcode to database
 */
export async function saveBarcodeToDatabase(
  productId: string,
  tenantId: string,
  barcode: string,
  format: BarcodeFormat
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('product_barcodes')
      .upsert({
        product_id: productId,
        tenant_id: tenantId,
        barcode,
        format,
        is_active: true,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save barcode',
    }
  }
}

/**
 * Get barcode for a product
 */
export async function getProductBarcode(
  productId: string,
  tenantId: string
): Promise<{ barcode: string; format: BarcodeFormat } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_barcodes')
    .select('barcode, format')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  return {
    barcode: data.barcode,
    format: data.format as BarcodeFormat,
  }
}

