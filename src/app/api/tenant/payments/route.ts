/**
 * Tenant Payments API
 * 
 * POST /api/tenant/payments - Create payment using tenant's configured gateway
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PaymentGatewayCode } from '@/types/supabase'
import { processPayment, getAvailableGateways } from '@/lib/payments'

const supabase: any = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getTenantId(request: NextRequest): Promise<string | null> {
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'

  let tenant = null

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

  return tenant?.id || null
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.amount || !body.orderId || !body.customerEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount, orderId, customerEmail' 
      }, { status: 400 })
    }

    // Get base URL for callbacks
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Process payment using tenant's configured gateway
    const result = await processPayment(
      tenantId,
      body.gatewayCode as PaymentGatewayCode | null, // null = use default
      {
        amount: body.amount,
        currency: body.currency || 'ZAR',
        orderId: body.orderId,
        orderNumber: body.orderNumber || body.orderId,
        customerEmail: body.customerEmail,
        customerName: body.customerName || '',
        itemName: body.itemName || `Order ${body.orderId}`,
        successUrl: body.successUrl || `${baseUrl}/checkout/success`,
        cancelUrl: body.cancelUrl || `${baseUrl}/checkout/cancel`,
        notifyUrl: body.notifyUrl || `${baseUrl}/api/webhooks/payments`,
        metadata: body.metadata || {},
      }
    )

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Payment creation failed' 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      redirectUrl: result.redirectUrl,
      gatewayCode: result.gatewayCode,
    })

  } catch (error: any) {
    console.error('Payment API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - List available payment gateways for this tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const gateways = await getAvailableGateways(tenantId)

    return NextResponse.json({ gateways })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

