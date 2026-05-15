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
  if (!slug) return null
  const { data } = await sb().from('tenants').select('id').or(`subdomain.eq.${slug},slug.eq.${slug}`).eq('is_active', true).single()
  return data?.id || null
}

// GET — list all discount codes for tenant (admin)
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data, error } = await sb()
    .from('discount_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discounts: data || [] })
}

// POST — create discount code
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  if (!body.code || !body.type || body.value === undefined) {
    return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 })
  }

  const { data, error } = await sb()
    .from('discount_codes')
    .insert({
      tenant_id: tenantId,
      code: body.code.toUpperCase().trim(),
      type: body.type,
      value: body.value,
      max_uses: body.max_uses || null,
      expires_at: body.expires_at || null,
      min_order_zar: body.min_order_zar || 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discount: data }, { status: 201 })
}

// PATCH — toggle active / update
export async function PATCH(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const row: Record<string, any> = {}
  if (body.is_active !== undefined) row.is_active = body.is_active
  if (body.max_uses !== undefined) row.max_uses = body.max_uses
  if (body.expires_at !== undefined) row.expires_at = body.expires_at

  const { data, error } = await sb()
    .from('discount_codes')
    .update(row)
    .eq('id', body.id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discount: data })
}

// DELETE
export async function DELETE(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await sb().from('discount_codes').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
