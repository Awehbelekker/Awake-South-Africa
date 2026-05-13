/**
 * Create a PayFast subscription payment for platform billing.
 * POST /api/billing/subscribe
 * Body: { tenantId, planName, email, name }
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function signPayFast(data: Record<string, string>, passPhrase = ''): string {
  let str = Object.keys(data).sort()
    .filter(k => data[k] !== '')
    .map(k => `${k}=${encodeURIComponent(data[k].trim()).replace(/%20/g, '+')}`)
    .join('&')
  if (passPhrase) str += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`
  return crypto.createHash('md5').update(str).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, planName, email, name } = await req.json()

    if (!tenantId || !planName || !email || !name) {
      return NextResponse.json({ error: 'Missing required fields: tenantId, planName, email, name' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Load plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single()

    if (!plan) {
      return NextResponse.json({ error: `Plan '${planName}' not found` }, { status: 404 })
    }

    const merchantId  = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!
    const merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!
    const passPhrase  = process.env.PAYFAST_PASSPHRASE || ''
    const mode        = process.env.NEXT_PUBLIC_PAYFAST_MODE || 'live'
    const baseUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://awake-boards-infrastructure.vercel.app'
    const paymentUrl  = mode === 'sandbox'
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process'

    // Unique payment ID embeds tenant + plan for webhook resolution
    const paymentId = `SUB-${tenantId.slice(0, 8)}-${planName.toUpperCase()}-${Date.now()}`

    const data: Record<string, string> = {
      merchant_id:          merchantId,
      merchant_key:         merchantKey,
      return_url:           `${baseUrl}/master-admin?subscribed=1`,
      cancel_url:           `${baseUrl}/master-admin?cancelled=1`,
      notify_url:           `${baseUrl}/api/billing/notify`,
      name_first:           name.split(' ')[0] || name,
      name_last:            name.split(' ').slice(1).join(' ') || '',
      email_address:        email,
      m_payment_id:         paymentId,
      amount:               plan.price_zar.toFixed(2),
      item_name:            plan.payfast_item_name || `${plan.display_name} Plan`,
      item_description:     `Monthly subscription — ${plan.display_name} plan`,
      email_confirmation:   '1',
      confirmation_address: email,
      // Recurring billing
      subscription_type:    '1',
      billing_date:         new Date().toISOString().split('T')[0],
      recurring_amount:     plan.price_zar.toFixed(2),
      frequency:            '3', // monthly
      cycles:               '0', // indefinite
    }

    data.signature = signPayFast(data, passPhrase)

    // Store pending subscription record
    await supabase.from('tenant_subscriptions').upsert({
      tenant_id:  tenantId,
      plan_id:    plan.id,
      status:     'trial',
    }, { onConflict: 'tenant_id' })

    return NextResponse.json({ url: paymentUrl, data, paymentId })
  } catch (error) {
    console.error('Billing subscribe error:', error)
    return NextResponse.json({ error: 'Failed to create subscription payment' }, { status: 500 })
  }
}
