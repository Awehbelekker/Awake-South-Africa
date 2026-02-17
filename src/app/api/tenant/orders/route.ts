/**
 * Tenant Orders API
 * 
 * GET /api/tenant/orders - Get orders for current tenant (admin)
 * POST /api/tenant/orders - Create order (checkout)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'

  let tenant = null

  if (isCustomDomain && customDomain) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('domain', customDomain)
      .eq('is_active', true)
      .single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`)
      .eq('is_active', true)
      .single()
    tenant = data
  }

  return tenant?.id || null
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // TODO: Add admin authentication check here
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = getSupabase()
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query

    if (error) throw error

    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.customerEmail || !body.customerName || !body.items || body.items.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: customerEmail, customerName, items' 
      }, { status: 400 })
    }

    const orderData = {
      tenant_id: tenantId,
      order_number: generateOrderNumber(),
      customer_email: body.customerEmail,
      customer_name: body.customerName,
      customer_phone: body.customerPhone || null,
      shipping_address: body.shippingAddress || null,
      billing_address: body.billingAddress || null,
      items: body.items,
      subtotal: body.subtotal,
      tax_amount: body.taxAmount || 0,
      shipping_amount: body.shippingAmount || 0,
      discount_amount: body.discountAmount || 0,
      total: body.total,
      currency: body.currency || 'ZAR',
      status: 'pending',
      payment_status: 'pending',
      fulfillment_status: 'unfulfilled',
      payment_gateway: body.paymentGateway || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    }

    const { data: order, error } = await getSupabase()
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      order,
      orderNumber: order.order_number
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

