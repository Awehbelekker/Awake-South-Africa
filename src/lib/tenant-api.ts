/**
 * Shared helpers for tenant-scoped API routes.
 */

import { NextRequest } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase not configured')
  }
  return createClient(url, key)
}

export async function getTenantIdFromRequest(request: NextRequest): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'
  const explicitTenantId = new URL(request.url).searchParams.get('tenant_id')

  if (explicitTenantId) return explicitTenantId

  let tenant: { id: string } | null = null

  if (isCustomDomain && customDomain) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', customDomain)
      .eq('is_active', true)
      .single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`)
      .eq('is_active', true)
      .single()
    tenant = data
  }

  if (!tenant) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'awake-sa')
      .single()
    tenant = data
  }

  return tenant?.id || null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Map slug, Medusa id, or SKU to the Supabase products.id UUID. */
export async function resolveProductUuid(
  tenantId: string,
  idOrSlug: string
): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenantId)
    .or(`slug.eq.${idOrSlug},sku.eq.${idOrSlug}`)
    .maybeSingle()

  if (data?.id) return data.id

  // Medusa / legacy ids stored in metadata.localId
  const { data: byMeta } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenantId)
    .contains('metadata', { localId: idOrSlug })
    .maybeSingle()

  return byMeta?.id || null
}
