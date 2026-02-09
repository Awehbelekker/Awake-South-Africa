/**
 * Invoice OCR Scanner Service
 * 
 * Scans supplier invoices using Tesseract.js OCR
 * Extracts structured data (supplier, items, prices, totals)
 * 
 * Features:
 * - Image-to-text OCR
 * - Invoice data extraction
 * - Supplier detection
 * - Line item parsing
 * - Automatic supplier creation
 */

import { createClient } from '@/lib/supabase/client'
import type {
  OCRResult,
  OCRExtractionResult,
  InvoiceData,
  InvoiceLineItem,
  OCRConfig,
  SupplierMatch,
} from './types'

/**
 * Scan invoice image using Tesseract.js OCR
 * Client-side only
 */
export async function scanInvoiceImage(
  imageFile: File | string,
  config: OCRConfig = {}
): Promise<OCRResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'OCR scanning is only available on the client side',
    }
  }

  // @ts-ignore - Tesseract is loaded globally
  if (typeof Tesseract === 'undefined') {
    return {
      success: false,
      error: 'Tesseract.js library not loaded. Please include the library.',
    }
  }

  const startTime = Date.now()

  try {
    // @ts-ignore
    const worker = await Tesseract.createWorker({
      logger: (m: any) => console.log(m), // Progress logging
    })

    await worker.loadLanguage(config.language || 'eng')
    await worker.initialize(config.language || 'eng')

    const {
      data: { text, confidence },
    } = await worker.recognize(imageFile)

    await worker.terminate()

    const processingTimeMs = Date.now() - startTime

    return {
      success: true,
      text,
      confidence,
      processingTimeMs,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR scanning failed',
      processingTimeMs: Date.now() - startTime,
    }
  }
}

/**
 * Extract structured invoice data from OCR text
 * Uses pattern matching and AI assistance
 */
export function extractInvoiceData(ocrText: string): OCRExtractionResult {
  try {
    const invoiceData: InvoiceData = {}

    // Extract invoice number
    const invoiceNumberMatch = ocrText.match(
      /(?:invoice|inv|invoice\s*#|inv\s*#|invoice\s*no|inv\s*no)[:\s]*([A-Z0-9\-\/]+)/i
    )
    if (invoiceNumberMatch) {
      invoiceData.invoiceNumber = invoiceNumberMatch[1].trim()
    }

    // Extract dates
    const datePatterns = [
      /(?:date|invoice\s*date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    ]
    for (const pattern of datePatterns) {
      const match = ocrText.match(pattern)
      if (match) {
        invoiceData.invoiceDate = match[1]
        break
      }
    }

    // Extract due date
    const dueDateMatch = ocrText.match(
      /(?:due\s*date|payment\s*due)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
    )
    if (dueDateMatch) {
      invoiceData.dueDate = dueDateMatch[1]
    }

    // Extract supplier name (usually at the top)
    const lines = ocrText.split('\n').filter((line) => line.trim().length > 0)
    if (lines.length > 0) {
      // First non-empty line is often the supplier name
      invoiceData.supplierName = lines[0].trim()
    }

    // Extract tax number
    const taxNumberMatch = ocrText.match(
      /(?:vat|tax|vat\s*no|tax\s*no|vat\s*#|tax\s*#)[:\s]*([A-Z0-9\-\/]+)/i
    )
    if (taxNumberMatch) {
      invoiceData.supplierTaxNumber = taxNumberMatch[1].trim()
    }

    // Extract totals
    const totalMatch = ocrText.match(/(?:total|grand\s*total|amount\s*due)[:\s]*[R$€£]?\s*([\d,]+\.?\d*)/i)
    if (totalMatch) {
      invoiceData.total = parseFloat(totalMatch[1].replace(/,/g, ''))
    }

    // Extract subtotal
    const subtotalMatch = ocrText.match(/(?:subtotal|sub\s*total)[:\s]*[R$€£]?\s*([\d,]+\.?\d*)/i)
    if (subtotalMatch) {
      invoiceData.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''))
    }

    // Extract tax/VAT
    const taxMatch = ocrText.match(/(?:vat|tax|vat\s*15%)[:\s]*[R$€£]?\s*([\d,]+\.?\d*)/i)
    if (taxMatch) {
      invoiceData.tax = parseFloat(taxMatch[1].replace(/,/g, ''))
    }

    // Extract currency
    const currencyMatch = ocrText.match(/[R$€£]/)
    if (currencyMatch) {
      const currencyMap: Record<string, string> = {
        'R': 'ZAR',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
      }
      invoiceData.currency = currencyMap[currencyMatch[0]] || 'ZAR'
    } else {
      invoiceData.currency = 'ZAR' // Default to South African Rand
    }

    // Extract line items (basic pattern matching)
    invoiceData.items = extractLineItems(ocrText)

    // Calculate confidence based on how much data we extracted
    let confidence = 0
    if (invoiceData.invoiceNumber) confidence += 20
    if (invoiceData.supplierName) confidence += 20
    if (invoiceData.total) confidence += 20
    if (invoiceData.invoiceDate) confidence += 15
    if (invoiceData.items && invoiceData.items.length > 0) confidence += 25

    return {
      success: true,
      invoiceData,
      rawText: ocrText,
      confidence,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract invoice data',
    }
  }
}

/**
 * Extract line items from invoice text
 */
function extractLineItems(text: string): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = []
  const lines = text.split('\n')

  // Look for lines with quantity, description, and price pattern
  // Example: "2 Widget ABC 100.00 200.00"
  const itemPattern = /(\d+(?:\.\d+)?)\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/

  for (const line of lines) {
    const match = line.match(itemPattern)
    if (match) {
      const [, quantity, description, unitPrice, total] = match
      items.push({
        description: description.trim(),
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice.replace(/,/g, '')),
        total: parseFloat(total.replace(/,/g, '')),
      })
    }
  }

  return items
}

/**
 * Find or create supplier from invoice data
 */
export async function findOrCreateSupplier(
  invoiceData: InvoiceData,
  tenantId: string
): Promise<SupplierMatch> {
  const supabase = createClient()

  if (!invoiceData.supplierName) {
    return {
      supplierName: 'Unknown Supplier',
      confidence: 0,
      isNewSupplier: false,
    }
  }

  // Try to find existing supplier by name
  const { data: existingSuppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .ilike('name', `%${invoiceData.supplierName}%`)
    .limit(5)

  if (existingSuppliers && existingSuppliers.length > 0) {
    // Found existing supplier
    return {
      supplierId: existingSuppliers[0].id,
      supplierName: existingSuppliers[0].name,
      confidence: 80,
      isNewSupplier: false,
    }
  }

  // Create new supplier
  const { data: newSupplier, error } = await supabase
    .from('suppliers')
    .insert({
      tenant_id: tenantId,
      name: invoiceData.supplierName,
      address: invoiceData.supplierAddress,
      tax_number: invoiceData.supplierTaxNumber,
      auto_created: true,
      is_active: true,
    })
    .select('id, name')
    .single()

  if (error || !newSupplier) {
    return {
      supplierName: invoiceData.supplierName,
      confidence: 50,
      isNewSupplier: true,
    }
  }

  return {
    supplierId: newSupplier.id,
    supplierName: newSupplier.name,
    confidence: 90,
    isNewSupplier: true,
  }
}

/**
 * Save invoice to database
 */
export async function saveInvoiceToDatabase(
  invoiceData: InvoiceData,
  supplierId: string,
  tenantId: string,
  imageUrl: string,
  ocrData: any
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const supabase = createClient()

  try {
    // Calculate due date if not provided (default: 30 days from invoice date)
    let dueDate = invoiceData.dueDate
    if (!dueDate && invoiceData.invoiceDate) {
      const invoiceDateObj = new Date(invoiceData.invoiceDate)
      invoiceDateObj.setDate(invoiceDateObj.getDate() + 30)
      dueDate = invoiceDateObj.toISOString().split('T')[0]
    }

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('supplier_invoices')
      .insert({
        tenant_id: tenantId,
        supplier_id: supplierId,
        invoice_number: invoiceData.invoiceNumber || `AUTO-${Date.now()}`,
        invoice_date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
        due_date: dueDate,
        subtotal: invoiceData.subtotal || 0,
        tax: invoiceData.tax || 0,
        total: invoiceData.total || 0,
        currency: invoiceData.currency || 'ZAR',
        status: 'pending',
        payment_status: 'unpaid',
        ocr_data: ocrData,
        scanned_image_url: imageUrl,
        auto_processed: true,
      })
      .select('id')
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error: invoiceError?.message || 'Failed to save invoice',
      }
    }

    // Insert line items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map((item) => ({
        invoice_id: invoice.id,
        tenant_id: tenantId,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        tax_rate: 15.0, // Default VAT
      }))

      await supabase.from('supplier_invoice_items').insert(itemsToInsert)
    }

    return {
      success: true,
      invoiceId: invoice.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save invoice',
    }
  }
}

/**
 * Complete invoice processing workflow
 * Scan -> Extract -> Find/Create Supplier -> Save
 */
export async function processInvoice(
  imageFile: File,
  tenantId: string
): Promise<{
  success: boolean
  invoiceId?: string
  supplierId?: string
  isNewSupplier?: boolean
  error?: string
}> {
  // Step 1: Scan image
  const ocrResult = await scanInvoiceImage(imageFile)
  if (!ocrResult.success || !ocrResult.text) {
    return {
      success: false,
      error: ocrResult.error || 'OCR scanning failed',
    }
  }

  // Step 2: Extract invoice data
  const extractionResult = extractInvoiceData(ocrResult.text)
  if (!extractionResult.success || !extractionResult.invoiceData) {
    return {
      success: false,
      error: extractionResult.error || 'Failed to extract invoice data',
    }
  }

  // Step 3: Find or create supplier
  const supplierMatch = await findOrCreateSupplier(extractionResult.invoiceData, tenantId)
  if (!supplierMatch.supplierId) {
    return {
      success: false,
      error: 'Failed to create supplier',
    }
  }

  // Step 4: Upload image to storage (placeholder - implement with Supabase Storage)
  const imageUrl = URL.createObjectURL(imageFile) // Temporary - replace with actual upload

  // Step 5: Save invoice to database
  const saveResult = await saveInvoiceToDatabase(
    extractionResult.invoiceData,
    supplierMatch.supplierId,
    tenantId,
    imageUrl,
    {
      rawText: ocrResult.text,
      confidence: ocrResult.confidence,
      extractedData: extractionResult.invoiceData,
    }
  )

  if (!saveResult.success) {
    return {
      success: false,
      error: saveResult.error,
    }
  }

  return {
    success: true,
    invoiceId: saveResult.invoiceId,
    supplierId: supplierMatch.supplierId,
    isNewSupplier: supplierMatch.isNewSupplier,
  }
}
