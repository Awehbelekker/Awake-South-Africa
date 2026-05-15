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

// POST /api/tenant/shipping/quote
// Body: { province, total_zar, weight_kg? }
// Returns: { rate, label, courier, free }
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { province = '', total_zar = 0 } = await request.json()

  // Load tenant shipping zones
  const { data: zones } = await sb()
    .from('shipping_zones')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at')

  const provinceUpper = province.toUpperCase()

  // Find matching zone: exact province match, or wildcard ("*")
  const matchedZone = (zones || []).find((z: any) => {
    const provinces: string[] = z.provinces || []
    return provinces.includes(provinceUpper) || provinces.includes('*')
  })

  // Fallback defaults if no zones configured
  if (!matchedZone) {
    return NextResponse.json({
      rate: total_zar >= 10000 ? 0 : 99,
      label: total_zar >= 10000 ? 'Free Delivery' : 'Standard Delivery',
      courier: 'courier_guy',
      free: total_zar >= 10000,
    })
  }

  // Free shipping threshold
  if (matchedZone.rate_type === 'free' ||
      (matchedZone.free_above_zar !== null && total_zar >= matchedZone.free_above_zar)) {
    return NextResponse.json({
      rate: 0,
      label: `Free Delivery (${matchedZone.name})`,
      courier: matchedZone.courier || 'courier_guy',
      free: true,
    })
  }

  return NextResponse.json({
    rate: matchedZone.flat_rate_zar || 99,
    label: matchedZone.name,
    courier: matchedZone.courier || 'courier_guy',
    free: false,
  })
}

// GET — list zones for admin
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data, error } = await sb()
    .from('shipping_zones')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ zones: data || [] })
}

// POST to /api/tenant/shipping/quote?manage=true creates a zone
export async function PUT(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await sb()
    .from('shipping_zones')
    .insert({
      tenant_id: tenantId,
      name: body.name,
      provinces: body.provinces || ['*'],
      rate_type: body.rate_type || 'flat',
      flat_rate_zar: body.flat_rate_zar || 99,
      free_above_zar: body.free_above_zar || null,
      courier: body.courier || 'courier_guy',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ zone: data }, { status: 201 })
}

// DELETE a zone
export async function DELETE(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await sb().from('shipping_zones').delete().eq('id', id).eq('tenant_id', tenantId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
