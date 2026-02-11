/**
 * Master Admin - Single Tenant API
 * 
 * GET /api/master-admin/tenants/[id] - Get tenant details
 * PUT /api/master-admin/tenants/[id] - Update tenant
 * DELETE /api/master-admin/tenants/[id] - Delete tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  const masterKey = process.env.MASTER_ADMIN_API_KEY
  if (!masterKey) return false
  return authHeader === `Bearer ${masterKey}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get tenant with payment gateways
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get payment gateways
    const { data: gateways } = await supabase
      .from('tenant_payment_gateways')
      .select(`
        id,
        is_enabled,
        is_default,
        is_sandbox,
        payment_gateways (code, name)
      `)
      .eq('tenant_id', id)

    return NextResponse.json({ 
      tenant,
      paymentGateways: gateways || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    
    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {}
    const allowedFields = [
      'name', 'email', 'phone', 'subdomain', 'domain',
      'logo_url', 'favicon_url', 'primary_color', 'secondary_color', 'accent_color',
      'currency', 'tax_rate', 'timezone', 'plan', 'is_active',
      'google_drive_client_id', 'google_drive_client_secret', 
      'google_drive_refresh_token', 'google_drive_folder_id', 'google_drive_enabled'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data: tenant, error } = await (supabase as any)
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, tenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Soft delete - just deactivate
    const { error } = await supabase
      .from('tenants')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Tenant deactivated' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

