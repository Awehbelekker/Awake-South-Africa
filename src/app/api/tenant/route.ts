export const dynamic = 'force-dynamic'

/**
 * Tenant Context API
 * 
 * GET /api/tenant - Get current tenant info based on hostname
 * 
 * This is called by the TenantContext on the frontend to get
 * the current tenant's branding, settings, and configuration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant identifier from headers (set by middleware)
    const tenantSlug = request.headers.get('x-tenant-slug')
    const customDomain = request.headers.get('x-custom-domain')
    const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'

    let tenant = null

    if (isCustomDomain && customDomain) {
      // Look up by custom domain
      const { data } = await getSupabase()
        .from('tenants')
        .select('*')
        .eq('domain', customDomain)
        .eq('is_active', true)
        .single()
      tenant = data
    } else if (tenantSlug) {
      // Look up by subdomain/slug
      const { data } = await getSupabase()
        .from('tenants')
        .select('*')
        .or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`)
        .eq('is_active', true)
        .single()
      tenant = data
    }

    if (!tenant) {
      // For localhost development, use Awake tenant as default
      if (request.headers.get('host')?.includes('localhost')) {
        const { data: defaultTenant } = await getSupabase()
          .from('tenants')
          .select('*')
          .eq('slug', 'awake')
          .single()
        
        if (defaultTenant) {
          tenant = defaultTenant
          console.log('Development mode: Using Awake tenant as default')
        }
      }
    }

    if (!tenant) {
      // Return default/fallback tenant or error
      return NextResponse.json({ 
        error: 'Tenant not found',
        isDefault: true,
        // Provide minimal default config for development
        tenant: {
          name: 'Awake Store',
          slug: 'default',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          accent_color: '#F59E0B',
          currency: 'ZAR',
        }
      }, { status: 200 })
    }

    // Get enabled payment gateways (without credentials)
    const { data: gateways } = await getSupabase()
      .from('tenant_payment_gateways')
      .select(`
        is_default,
        is_sandbox,
        payment_gateways (code, name)
      `)
      .eq('tenant_id', tenant.id)
      .eq('is_enabled', true)

    // Return tenant config (safe fields only - no secrets)
    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        phone: tenant.phone,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        // Branding
        logo_url: tenant.logo_url,
        favicon_url: tenant.favicon_url,
        primary_color: tenant.primary_color,
        secondary_color: tenant.secondary_color,
        accent_color: tenant.accent_color,
        // Settings
        currency: tenant.currency,
        tax_rate: tenant.tax_rate,
        timezone: tenant.timezone,
        // Features
        has_cloud_storage: tenant.google_drive_enabled || tenant.onedrive_enabled,
      },
      paymentGateways: gateways?.map((g: any) => ({
        code: g.payment_gateways?.code,
        name: g.payment_gateways?.name,
        isDefault: g.is_default,
        isSandbox: g.is_sandbox,
      })) || [],
    })

  } catch (error: any) {
    console.error('Tenant API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

