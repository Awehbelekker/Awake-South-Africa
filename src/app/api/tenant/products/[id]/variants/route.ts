export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getTenantIdFromRequest, resolveProductUuid } from '@/lib/tenant-api'

// GET /api/tenant/products/[id]/variants
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) return NextResponse.json({ variants: [] })

  const { data, error } = await getSupabaseAdmin()
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ variants: data || [] })
}

// POST /api/tenant/products/[id]/variants
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const productId = await resolveProductUuid(tenantId, params.id)
  if (!productId) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await getSupabaseAdmin()
    .from('product_variants')
    .insert({
      product_id: productId,
      tenant_id: tenantId,
      name: body.name,
      options: body.options || {},
      sku: body.sku || null,
      price_override: body.price_override || null,
      stock_count: body.stock_count || 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ variant: data }, { status: 201 })
}

// PATCH /api/tenant/products/[id]/variants?variant_id=xxx
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const variantId = new URL(request.url).searchParams.get('variant_id')
  if (!variantId) return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 })

  const body = await request.json()
  const row: Record<string, unknown> = {}
  if (body.name !== undefined) row.name = body.name
  if (body.options !== undefined) row.options = body.options
  if (body.sku !== undefined) row.sku = body.sku
  if (body.price_override !== undefined) row.price_override = body.price_override
  if (body.stock_count !== undefined) row.stock_count = body.stock_count
  if (body.is_active !== undefined) row.is_active = body.is_active

  const { data, error } = await getSupabaseAdmin()
    .from('product_variants')
    .update(row)
    .eq('id', variantId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ variant: data })
}

// DELETE /api/tenant/products/[id]/variants?variant_id=xxx
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantIdFromRequest(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const variantId = new URL(request.url).searchParams.get('variant_id')
  if (!variantId) return NextResponse.json({ error: 'Missing variant_id' }, { status: 400 })

  const { error } = await getSupabaseAdmin()
    .from('product_variants')
    .update({ is_active: false })
    .eq('id', variantId)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
