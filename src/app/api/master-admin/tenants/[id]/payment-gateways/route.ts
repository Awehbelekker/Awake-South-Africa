export const dynamic = 'force-dynamic'

/**
 * Master Admin - Tenant Payment Gateways API
 * 
 * GET /api/master-admin/tenants/[id]/payment-gateways - List tenant's gateways
 * POST /api/master-admin/tenants/[id]/payment-gateways - Add gateway to tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PaymentGatewayCode } from '@/types/supabase'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
    const { data: gateways, error } = await getSupabase()
      .from('tenant_payment_gateways')
      .select(`
        id,
        is_enabled,
        is_default,
        is_sandbox,
        created_at,
        payment_gateways (
          id,
          code,
          name,
          description,
          supported_currencies
        )
      `)
      .eq('tenant_id', id)
      .order('is_default', { ascending: false })

    if (error) throw error

    return NextResponse.json({ gateways })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: tenantId } = await params

  try {
    const body = await request.json()
    
    // Validate
    if (!body.gatewayCode || !body.credentials) {
      return NextResponse.json({ 
        error: 'Missing required fields: gatewayCode, credentials' 
      }, { status: 400 })
    }

    // Get gateway ID from code
    const { data: gateway, error: gatewayError } = await getSupabase()
      .from('payment_gateways')
      .select('id')
      .eq('code', body.gatewayCode)
      .single()

    if (gatewayError || !gateway) {
      return NextResponse.json({ error: 'Invalid gateway code' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await getSupabase()
        .from('tenant_payment_gateways')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
    }

    // Add gateway to tenant
    const { data: tenantGateway, error } = await getSupabase()
      .from('tenant_payment_gateways')
      .upsert({
        tenant_id: tenantId,
        gateway_id: gateway.id,
        credentials: body.credentials,
        is_enabled: body.isEnabled ?? true,
        is_default: body.isDefault ?? false,
        is_sandbox: body.isSandbox ?? true,
      }, { onConflict: 'tenant_id,gateway_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      gateway: tenantGateway,
      message: `${body.gatewayCode} added successfully`
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

