export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getTenantIdFromRequest, resolveProductUuid } from '@/lib/tenant-api'

// GET — approved reviews for a product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) return NextResponse.json({ reviews: [], average: 0, count: 0 })

  const { data, error } = await getSupabaseAdmin()
    .from('reviews')
    .select('id, customer_name, rating, body, created_at')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reviews = data || []
  const avg = reviews.length > 0
    ? reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length })
}

// POST — submit a new review (pending approval)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const body = await request.json()
  if (!body.customer_email || !body.customer_name || !body.rating) {
    return NextResponse.json({ error: 'name, email, and rating are required' }, { status: 400 })
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  const { error } = await getSupabaseAdmin()
    .from('reviews')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      rating: body.rating,
      body: body.body || '',
      approved: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Review submitted and awaiting approval' }, { status: 201 })
}
