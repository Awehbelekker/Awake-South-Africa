export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import {
  analyzeProductPrice,
  batchAnalyzePrices,
  savePriceAnalysis,
  getPriceHistory,
  requestPriceChange,
  approvePriceChange,
  rejectPriceChange,
  getPendingPriceChanges,
  bulkApprovePriceChanges,
} from '@/lib/ai/price-comparison-agent'

/**
 * POST /api/ai/price-comparison
 * 
 * Analyze product pricing against market data.
 * NEVER auto-applies price changes — all changes require user approval.
 * 
 * Body:
 *   { action: "analyze", sku, productName, supplierCost, currentRetailPrice?, options? }
 *   { action: "batch", tenantId, pricelistId?, options? }
 *   { action: "history", tenantId, sku, days? }
 *   { action: "request-change", tenantId, analysis }
 *   { action: "approve", requestId, userId, tenantId }
 *   { action: "reject", requestId, userId, tenantId, reason? }
 *   { action: "pending", tenantId }
 *   { action: "bulk-approve", requestIds[], userId, tenantId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'analyze': {
        const { sku, productName, supplierCost, currentRetailPrice, options } = body
        
        if (!sku || !productName || !supplierCost) {
          return NextResponse.json(
            { error: 'Missing required fields: sku, productName, supplierCost' },
            { status: 400 }
          )
        }

        const analysis = await analyzeProductPrice(
          sku,
          productName,
          supplierCost,
          currentRetailPrice,
          options
        )

        // Save analysis if tenantId provided
        if (body.tenantId) {
          await savePriceAnalysis(body.tenantId, analysis)
        }

        // NOTE: Price is NOT applied. Returns recommendation only.
        return NextResponse.json({ success: true, analysis, message: 'Price recommendation generated. Use approve action to apply.' })
      }

      case 'batch': {
        const { tenantId, pricelistId, options } = body
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Missing required field: tenantId' },
            { status: 400 }
          )
        }

        const result = await batchAnalyzePrices(tenantId, pricelistId, options)

        return NextResponse.json({ success: true, ...result, message: 'Recommendations generated. No prices were changed.' })
      }

      case 'history': {
        const { tenantId, sku, days } = body
        
        if (!tenantId || !sku) {
          return NextResponse.json(
            { error: 'Missing required fields: tenantId, sku' },
            { status: 400 }
          )
        }

        const history = await getPriceHistory(tenantId, sku, days)
        return NextResponse.json({ success: true, history })
      }

      case 'request-change': {
        const { tenantId, analysis } = body
        if (!tenantId || !analysis) {
          return NextResponse.json({ error: 'Missing tenantId or analysis' }, { status: 400 })
        }
        const changeRequest = await requestPriceChange(tenantId, analysis)
        return NextResponse.json({ success: true, changeRequest, message: 'Price change request created. Awaiting approval.' })
      }

      case 'approve': {
        const { requestId, userId, tenantId } = body
        if (!requestId || !userId || !tenantId) {
          return NextResponse.json({ error: 'Missing requestId, userId, or tenantId' }, { status: 400 })
        }
        const result = await approvePriceChange(requestId, userId, tenantId)
        return NextResponse.json(result)
      }

      case 'reject': {
        const { requestId, userId, tenantId, reason } = body
        if (!requestId || !userId || !tenantId) {
          return NextResponse.json({ error: 'Missing requestId, userId, or tenantId' }, { status: 400 })
        }
        const result = await rejectPriceChange(requestId, userId, tenantId, reason)
        return NextResponse.json(result)
      }

      case 'pending': {
        const { tenantId } = body
        if (!tenantId) {
          return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })
        }
        const pending = await getPendingPriceChanges(tenantId)
        return NextResponse.json({ success: true, pending, count: pending.length })
      }

      case 'bulk-approve': {
        const { requestIds, userId, tenantId } = body
        if (!requestIds || !userId || !tenantId) {
          return NextResponse.json({ error: 'Missing requestIds, userId, or tenantId' }, { status: 400 })
        }
        const result = await bulkApprovePriceChanges(requestIds, userId, tenantId)
        return NextResponse.json({ success: true, ...result })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze, batch, history, request-change, approve, reject, pending, bulk-approve' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Price comparison error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Price comparison failed' },
      { status: 500 }
    )
  }
}
