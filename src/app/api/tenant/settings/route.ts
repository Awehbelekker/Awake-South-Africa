export const dynamic = 'force-dynamic'

/**
 * GET  /api/tenant/settings  — fetch store-level settings from tenants table
 * PATCH /api/tenant/settings  — save store-level settings to tenants table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const supabase = getSupabase()
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'
  const tenantSlug = request.headers.get('x-tenant-slug')

  let tenant = null

  if (isCustomDomain && customDomain) {
    const { data } = await supabase.from('tenants').select('id').eq('domain', customDomain).eq('is_active', true).single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await supabase.from('tenants').select('id').or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`).eq('is_active', true).single()
    tenant = data
  }

  if (!tenant) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', 'awake-sa').single()
    tenant = data
  }

  return tenant?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { data, error } = await getSupabase()
      .from('tenants')
      .select('name, email, phone, currency, tax_rate, settings')
      .eq('id', tenantId)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      storeName: data.name,
      email: data.email,
      phone: data.phone,
      currency: data.currency || 'ZAR',
      taxRate: data.tax_rate || 0.15,
      ...(data.settings || {}),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()

    // Top-level tenant columns
    const tenantUpdate: Record<string, any> = {}
    if (body.storeName !== undefined) tenantUpdate.name = body.storeName
    if (body.email !== undefined) tenantUpdate.email = body.email
    if (body.phone !== undefined) tenantUpdate.phone = body.phone
    if (body.currency !== undefined) tenantUpdate.currency = body.currency
    if (body.taxRate !== undefined) tenantUpdate.tax_rate = body.taxRate

    // Everything else goes into the settings JSONB column
    const { storeName: _sn, email: _em, phone: _ph, currency: _cu, taxRate: _tr, ...extras } = body
    if (Object.keys(extras).length > 0) {
      // Merge with existing settings
      const { data: existing } = await getSupabase()
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()
      tenantUpdate.settings = { ...(existing?.settings || {}), ...extras }
    }

    if (Object.keys(tenantUpdate).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' })
    }

    const { error } = await getSupabase()
      .from('tenants')
      .update(tenantUpdate)
      .eq('id', tenantId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
