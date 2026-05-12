export const dynamic = 'force-dynamic'

/**
 * GET /api/tenant/payment-gateways — list active gateways for the current tenant
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
    if (!tenantId) return NextResponse.json({ gateways: [] })

    const { data: gateways, error } = await getSupabase()
      .from('tenant_payment_gateways')
      .select(`
        id, is_enabled, is_default, is_sandbox,
        payment_gateways ( id, code, name, description, supported_currencies )
      `)
      .eq('tenant_id', tenantId)
      .order('is_default', { ascending: false })

    if (error) throw error

    return NextResponse.json({ gateways: gateways || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
