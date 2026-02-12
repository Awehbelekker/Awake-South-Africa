/**
 * Payment Webhooks Handler
 * 
 * POST /api/webhooks/payments - Handle payment gateway webhooks
 * 
 * This endpoint receives webhooks from all payment gateways and routes
 * them to the appropriate handler based on the gateway type.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PaymentGatewayCode } from '@/types/supabase'
import { verifyWebhook } from '@/lib/payments'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)
    
    // Determine gateway from webhook data
    let gatewayCode: PaymentGatewayCode | null = null
    let tenantId: string | null = null
    let orderId: string | null = null

    // PayFast webhook detection
    if (body.merchant_id && body.pf_payment_id) {
      gatewayCode = 'payfast'
      orderId = body.m_payment_id
    }
    // Yoco webhook detection
    else if (body.type && body.type.startsWith('payment.')) {
      gatewayCode = 'yoco'
      orderId = body.payload?.metadata?.orderId
    }
    // Peach Payments webhook detection
    else if (body.result && body.id && body.paymentBrand) {
      gatewayCode = 'peach'
      orderId = body.merchantTransactionId
    }
    // iKhokha webhook detection
    else if (body.transactionId && body.merchantReference) {
      gatewayCode = 'ikhokha'
      orderId = body.merchantReference
    }
    // Stripe webhook detection
    else if (body.type && body.data?.object) {
      gatewayCode = 'stripe'
      orderId = body.data.object.metadata?.orderId
    }

    if (!gatewayCode || !orderId) {
      console.error('Unknown webhook format:', body)
      return NextResponse.json({ error: 'Unknown webhook format' }, { status: 400 })
    }

    // Get order to find tenant
    const { data: order } = await supabase
      .from('orders')
      .select('tenant_id, id, status')
      .eq('order_number', orderId)
      .single()

    if (!order) {
      console.error('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    tenantId = order.tenant_id

    // Verify webhook signature using tenant's gateway credentials
    const signature = request.headers.get('x-signature') || 
                      request.headers.get('x-payfast-signature') ||
                      request.headers.get('stripe-signature') || ''

    const result = await verifyWebhook(tenantId, gatewayCode, {
      body,
      signature,
      rawBody,
    })

    if (!result.verified) {
      console.error('Webhook verification failed:', result.error)
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
    }

    // Update order based on payment status
    const updateData: Record<string, any> = {
      payment_gateway: gatewayCode,
      payment_id: result.paymentId,
    }

    if (result.status === 'completed') {
      updateData.payment_status = 'paid'
      updateData.status = 'confirmed'
    } else if (result.status === 'failed') {
      updateData.payment_status = 'failed'
      updateData.status = 'cancelled'
    } else if (result.status === 'pending') {
      updateData.payment_status = 'pending'
    }

    await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)

    console.log(`Order ${orderId} updated: ${result.status}`)

    return NextResponse.json({ success: true, status: result.status })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

