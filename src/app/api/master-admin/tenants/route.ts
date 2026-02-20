export const dynamic = 'force-dynamic'

/**
 * Master Admin - Tenants API
 * 
 * GET /api/master-admin/tenants - List all tenants
 * POST /api/master-admin/tenants - Create new tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Check auth via cookie or API key
async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Check cookie-based auth (for web dashboard)
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('master_admin_auth')
  
  if (authCookie) {
    return true
  }

  // Check API key auth (for API clients)
  const authHeader = request.headers.get('authorization')
  const masterKey = process.env.MASTER_ADMIN_API_KEY
  
  if (masterKey && authHeader === `Bearer ${masterKey}`) {
    return true
  }

  return false
}

export async function GET(request: NextRequest) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: tenants, error } = await getSupabase()
      .from('tenants')
      .select(`
        id,
        slug,
        name,
        domain,
        subdomain,
        email,
        phone,
        primary_color,
        secondary_color,
        accent_color,
        logo_url,
        plan,
        is_active,
        google_drive_enabled,
        google_drive_last_sync,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get product counts per tenant
    const tenantsWithCounts = await Promise.all(
      (tenants || []).map(async (tenant) => {
        const { count } = await getSupabase()
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)

        return {
          ...tenant,
          product_count: count || 0,
        }
      })
    )

    return NextResponse.json({ tenants: tenantsWithCounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Validate required fields
    const required = ['name', 'slug', 'email']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create tenant
    const tenantData = {
      name: body.name,
      slug: body.slug,
      email: body.email,
      phone: body.phone || null,
      subdomain: body.subdomain || body.slug,
      domain: body.customDomain || null,
      logo_url: body.logoUrl || null,
      favicon_url: body.faviconUrl || null,
      primary_color: body.primaryColor || '#3B82F6',
      secondary_color: body.secondaryColor || '#1E40AF',
      accent_color: body.accentColor || '#F59E0B',
      currency: body.currency || 'ZAR',
      tax_rate: body.taxRate || 15,
      timezone: body.timezone || 'Africa/Johannesburg',
      plan: body.plan || 'basic',
      is_active: true,
      // Google Drive (optional)
      google_drive_client_id: body.googleDrive?.clientId || null,
      google_drive_client_secret: body.googleDrive?.clientSecret || null,
      google_drive_refresh_token: body.googleDrive?.refreshToken || null,
      google_drive_folder_id: body.googleDrive?.folderId || null,
      google_drive_enabled: !!body.googleDrive?.clientId,
    }

    const { data: tenant, error } = await getSupabase()
      .from('tenants')
      .insert(tenantData)
      .select()
      .single()

    if (error) throw error

    // Add payment gateways if provided
    if (body.paymentGateways && body.paymentGateways.length > 0) {
      for (const gateway of body.paymentGateways) {
        // Get gateway ID
        const { data: gatewayRecord } = await getSupabase()
          .from('payment_gateways')
          .select('id')
          .eq('code', gateway.code)
          .single()

        if (gatewayRecord) {
          await getSupabase().from('tenant_payment_gateways').insert({
            tenant_id: tenant.id,
            gateway_id: gatewayRecord.id,
            credentials: gateway.credentials,
            is_enabled: true,
            is_default: gateway.isDefault || false,
            is_sandbox: gateway.isSandbox ?? true,
          })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      tenant,
      message: `Tenant "${tenant.name}" created successfully`
    }, { status: 201 })

  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A tenant with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

