export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const explicit = new URL(request.url).searchParams.get('tenant_id')
  if (explicit) return explicit
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    const { data } = await sb().from('tenants').select('id').eq('slug', 'awake-sa').single()
    return data?.id || null
  }
  const { data } = await sb().from('tenants').select('id').or(`subdomain.eq.${slug},slug.eq.${slug}`).eq('is_active', true).single()
  return data?.id || null
}

// GET — social proof data for a product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ views: 0, recent_purchases: 0, last_purchase_ago: null, low_stock: false })

  const productId = params.id

  // Increment view count — read current then write back
  try {
    const { data: cur } = await sb().from('products').select('view_count').eq('id', productId).single()
    await sb().from('products').update({ view_count: (cur?.view_count || 0) + 1 }).eq('id', productId)
  } catch { /* non-critical */ }

  // Get product view count + stock
  const { data: product } = await sb()
    .from('products')
    .select('view_count, stock_quantity, in_stock')
    .eq('id', productId)
    .single()

  // Recent purchases (last 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await sb()
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)
    .gte('created_at', yesterday)

  // Last purchase time
  const { data: lastOrder } = await sb()
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
  // Fire-and-forget increment
  sb()
    .from('products')
    .select('view_count')
    .eq('id', params.id)
    .single()
    .then(({ data }) => {
      if (data) {
        sb().from('products').update({ view_count: (data.view_count || 0) + 1 }).eq('id', params.id).then(() => {})
      }
    })

  return NextResponse.json({ success: true })
}
