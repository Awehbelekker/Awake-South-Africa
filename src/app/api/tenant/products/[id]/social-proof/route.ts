export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getTenantIdFromRequest, resolveProductUuid } from '@/lib/tenant-api'

// GET — social proof data for a product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ views: 0, recent_purchases: 0, last_purchase_ago: null, low_stock: false })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) {
    return NextResponse.json({ views: 0, recent_purchases: 0, last_purchase_ago: null, low_stock: false })
  }

  const supabase = getSupabaseAdmin()

  try {
    const { data: cur } = await supabase.from('products').select('view_count').eq('id', productId).single()
    await supabase.from('products').update({ view_count: (cur?.view_count || 0) + 1 }).eq('id', productId)
  } catch {
    // non-critical
  }

  const { data: product } = await supabase
    .from('products')
    .select('view_count, stock_quantity, in_stock')
    .eq('id', productId)
    .single()

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .gte('created_at', yesterday)

  const { data: lastOrder } = await supabase
    .from('order_items')
    .select('created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let lastPurchaseAgo: string | null = null
  if (lastOrder?.created_at) {
    const diffMs = Date.now() - new Date(lastOrder.created_at).getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHrs / 24)
    if (diffMin < 60) lastPurchaseAgo = `${diffMin} min ago`
    else if (diffHrs < 24) lastPurchaseAgo = `${diffHrs}h ago`
    else if (diffDays < 7) lastPurchaseAgo = `${diffDays} days ago`
  }

  const stockQty = product?.stock_quantity || 0
  const lowStock = product?.in_stock && stockQty > 0 && stockQty <= 5

  return NextResponse.json({
    views: product?.view_count || 0,
    recent_purchases: recentCount || 0,
    last_purchase_ago: lastPurchaseAgo,
    low_stock: lowStock,
    stock_count: stockQty,
  })
}

// POST — explicit view increment (called client-side)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ success: true })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) return NextResponse.json({ success: true })

  const supabase = getSupabaseAdmin()
  supabase
    .from('products')
    .select('view_count')
    .eq('id', productId)
    .single()
    .then(({ data }) => {
      if (data) {
        supabase.from('products').update({ view_count: (data.view_count || 0) + 1 }).eq('id', productId).then(() => {})
      }
    })

  return NextResponse.json({ success: true })
}
