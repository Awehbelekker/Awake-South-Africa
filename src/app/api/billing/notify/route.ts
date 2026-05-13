/**
 * PayFast ITN webhook for platform subscription payments.
 * Handles: payment success/failure, subscription renewal, cancellation.
 * POST /api/billing/notify
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function verifySignature(data: Record<string, string>, sig: string, passPhrase = ''): boolean {
  let str = Object.keys(data).sort()
    .filter(k => data[k] !== '')
    .map(k => `${k}=${encodeURIComponent(data[k].trim()).replace(/%20/g, '+')}`)
    .join('&')
  if (passPhrase) str += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`
  return crypto.createHash('md5').update(str).digest('hex') === sig
}

export async function POST(req: NextRequest) {
  try {
    const body   = await req.text()
    const params = new URLSearchParams(body)
    const data: Record<string, string> = {}
    params.forEach((v, k) => { data[k] = v })

    const sig       = data.signature
    delete data.signature

    const passPhrase = process.env.PAYFAST_PASSPHRASE || ''
    if (!verifySignature(data, sig, passPhrase)) {
      console.error('Billing ITN: invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const paymentStatus = data.payment_status           // COMPLETE | FAILED | CANCELLED
    const paymentId     = data.m_payment_id             // SUB-{tenantId8}-{PLAN}-{ts}
    const pfToken       = data.token                    // PayFast subscription token
    const amountGross   = parseFloat(data.amount_gross || '0')
    const pfPaymentId   = data.pf_payment_id

    // Extract tenantId prefix from paymentId (SUB-{tenantId8}-...)
    const tenantPrefix = paymentId?.split('-')[1]

    const supabase = getSupabase()

    // Resolve tenant from prefix
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .ilike('id', `${tenantPrefix}%`)
      .limit(1)

    const tenantId = tenants?.[0]?.id

    // Log event regardless of outcome
    if (tenantId) {
      await supabase.from('billing_events').insert({
        tenant_id:  tenantId,
        event_type: paymentStatus === 'COMPLETE' ? 'payment_success' : 'payment_failed',
        amount_zar: amountGross,
        payfast_id: pfPaymentId,
        payload:    data,
      })
    }

    if (paymentStatus !== 'COMPLETE') {
      console.log(`Billing ITN: non-complete status ${paymentStatus} for ${paymentId}`)
      return NextResponse.json({ success: true })
    }

    if (!tenantId) {
      console.error('Billing ITN: could not resolve tenant from paymentId', paymentId)
      return NextResponse.json({ success: true }) // 200 to prevent PayFast retries
    }

    // Activate subscription
    const periodStart = new Date()
    const periodEnd   = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    await supabase.from('tenant_subscriptions').upsert({
      tenant_id:             tenantId,
      status:                'active',
      payfast_token:         pfToken || null,
      current_period_start:  periodStart.toISOString(),
      current_period_end:    periodEnd.toISOString(),
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'tenant_id' })

    // Activate the tenant itself
    await supabase.from('tenants').update({ is_active: true }).eq('id', tenantId)

    console.log(`✅ Billing ITN: subscription activated for tenant ${tenantId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Billing ITN error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', endpoint: 'billing/notify' })
}
