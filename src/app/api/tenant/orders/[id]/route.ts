export const dynamic = 'force-dynamic'

/**
 * PATCH /api/tenant/orders/[id]
 * Update order status, payment status, tracking number.
 * Fires email + WhatsApp notifications when notify=true.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email-service'
import { sendWhatsApp } from '@/lib/whatsapp-service'

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
  const explicitId = new URL(request.url).searchParams.get('tenant_id')

  if (explicitId) return explicitId

  let tenant = null
  if (isCustomDomain && customDomain) {
    const { data } = await supabase.from('tenants').select('id').eq('domain', customDomain).eq('is_active', true).single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await supabase.from('tenants').select('id').or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`).eq('is_active', true).single()
    tenant = data
  }
  if (!tenant) {
    const { data } = await supabase.from('tenants').select('id').eq('slug', process.env.DEFAULT_TENANT_SLUG || 'awake-sa').single()
    tenant = data
  }
  return tenant?.id || null
}

const NOTIFICATION_SUBJECTS: Record<string, string> = {
  confirmed:  'Your order has been confirmed',
  processing: 'Your order is being processed',
  shipped:    'Your order is on its way!',
  delivered:  'Your order has been delivered',
  cancelled:  'Your order has been cancelled',
}

const NOTIFICATION_BODIES: Record<string, (o: any) => string> = {
  confirmed:  (o) => `<p>Hi ${o.customer_name},</p><p>Great news! Your order <strong>${o.order_number}</strong> has been confirmed and is being prepared.</p>`,
  processing: (o) => `<p>Hi ${o.customer_name},</p><p>Your order <strong>${o.order_number}</strong> is now being processed and will ship soon.</p>`,
  shipped:    (o) => `<p>Hi ${o.customer_name},</p><p>Your order <strong>${o.order_number}</strong> has been shipped!${o.tracking_number ? `<br/>Tracking number: <strong>${o.tracking_number}</strong>` : ''}</p>`,
  delivered:  (o) => `<p>Hi ${o.customer_name},</p><p>Your order <strong>${o.order_number}</strong> has been delivered. Enjoy!</p>`,
  cancelled:  (o) => `<p>Hi ${o.customer_name},</p><p>Your order <strong>${o.order_number}</strong> has been cancelled. Please contact us if you have any questions.</p>`,
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const { status, payment_status, tracking_number, notes, notify = false } = body

    // Fetch current order for notification data
    const { data: order, error: fetchErr } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Build update payload
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined)         updates.status = status
    if (payment_status !== undefined) updates.payment_status = payment_status
    if (tracking_number !== undefined) updates.tracking_number = tracking_number
    if (notes !== undefined)          updates.customer_notes = notes

    const { data: updated, error: updateErr } = await getSupabase()
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (updateErr) throw updateErr

    // ── Notifications ──────────────────────────────────────────────────────
    if (notify && status && order.customer_email && NOTIFICATION_SUBJECTS[status]) {
      const orderWithTracking = { ...order, tracking_number: tracking_number ?? order.tracking_number }
      const subject   = NOTIFICATION_SUBJECTS[status]
      const bodyFn    = NOTIFICATION_BODIES[status]
      const htmlBody  = bodyFn ? bodyFn(orderWithTracking) : ''

      const fmt = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(order.total || 0)

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
          <h2 style="color:#0a0a0a;margin-bottom:16px;">${subject}</h2>
          ${htmlBody}
          <p style="color:#666;font-size:13px;">Order total: ${fmt}</p>
          ${orderWithTracking.tracking_number ? `<p style="color:#666;font-size:13px;">Tracking: <strong>${orderWithTracking.tracking_number}</strong></p>` : ''}
          <p style="margin-top:24px;color:#333;">If you have any questions, please reply to this email.</p>
        </div>
      `

      sendEmail({ tenantId, to: order.customer_email, subject, html })
        .catch(e => console.error('Status notify email failed:', e))

      if (order.customer_phone) {
        const waTemplate = status === 'shipped'   ? 'order_shipped'
                         : status === 'delivered' ? 'order_ready'
                         : 'order_confirmed'

        sendWhatsApp({
          tenantId,
          to: order.customer_phone,
          template: waTemplate,
          vars: {
            name:         order.customer_name || 'Customer',
            order_id:     order.order_number || orderId,
            total:        fmt,
            tracking_url: orderWithTracking.tracking_number || '',
          },
        }).catch(e => console.error('Status notify WhatsApp failed:', e))
      }
    }

    return NextResponse.json({ success: true, order: updated })
  } catch (error: any) {
    console.error('Order PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const tenantId = await getTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { data, error } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    return NextResponse.json({ order: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
