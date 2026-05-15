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

// POST — upsert cart (called on add-to-cart with customer contact info)
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  const { session_id, customer_email, customer_phone, items, total_zar } = body

  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  const { data, error } = await sb()
    .from('carts')
    .upsert({
      tenant_id: tenantId,
      session_id,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      items: items || [],
      total_zar: total_zar || 0,
      last_activity: new Date().toISOString(),
    }, { onConflict: 'tenant_id,session_id' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, cart_id: data?.id })
}

// PATCH — mark cart as recovered (called after successful order)
export async function PATCH(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { session_id } = await request.json()
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

  await sb()
    .from('carts')
    .update({ recovered: true })
    .eq('tenant_id', tenantId)
    .eq('session_id', session_id)

  return NextResponse.json({ success: true })
}
