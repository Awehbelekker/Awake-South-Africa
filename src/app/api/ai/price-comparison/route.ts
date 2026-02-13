import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  analyzeProductPrice,
  batchAnalyzePrices,
  savePriceAnalysis,
  getPriceHistory,
} from '@/lib/ai/price-comparison-agent'

const supabase: any = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/ai/price-comparison
 * 
 * Analyze product pricing against market data
 * 
 * Body:
 *   { action: "analyze", sku, productName, supplierCost, currentRetailPrice?, options? }
 *   { action: "batch", tenantId, pricelistId?, options? }
 *   { action: "history", tenantId, sku, days? }
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

        return NextResponse.json({ success: true, analysis })
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

        return NextResponse.json({ success: true, ...result })
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

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze, batch, or history' },
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
