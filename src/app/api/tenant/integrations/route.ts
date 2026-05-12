export const dynamic = 'force-dynamic'

/**
 * GET  /api/tenant/integrations  — fetch this tenant's email + whatsapp config
 * PATCH /api/tenant/integrations  — save email_config and/or whatsapp_config
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
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'
  const explicitTenantId = new URL(request.url).searchParams.get('tenant_id')

  if (explicitTenantId) return explicitTenantId

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
      .select('email_config, whatsapp_config')
      .eq('id', tenantId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.email_config !== undefined) updates.email_config = body.email_config
    if (body.whatsapp_config !== undefined) updates.whatsapp_config = body.whatsapp_config

    const { error } = await getSupabase()
      .from('tenants')
      .update(updates)
      .eq('id', tenantId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
