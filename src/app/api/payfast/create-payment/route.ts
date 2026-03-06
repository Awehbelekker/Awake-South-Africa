export const dynamic = 'force-dynamic'

/**
 * PayFast Payment Creation API (Server-side)
 *
 * POST /api/payfast/create-payment
 *
 * Creates a PayFast payment with proper server-side signature generation.
 * The passphrase (PAYFAST_PASSPHRASE) is a server secret and must never
 * be sent to the client. This endpoint generates the signed form data that
 * the checkout page uses to redirect the customer to PayFast.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generatePayFastSignature(
  data: Record<string, string>,
  passPhrase: string = ''
): string {
  let pfOutput = ''
  // PayFast requires alphabetical ordering of parameters
  const sortedKeys = Object.keys(data).sort()

  for (const key of sortedKeys) {
    if (data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`
    }
  }

  pfOutput = pfOutput.slice(0, -1)

  if (passPhrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, '+')}`
  }

  return crypto.createHash('md5').update(pfOutput).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, itemName, itemDescription, paymentId, email, name, tenantId } = body

    if (!amount || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, email, name' },
        { status: 400 }
      )
    }

    // Try to get tenant-specific PayFast credentials
    let merchantId = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID!
    let merchantKey = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY!
    let passPhrase = process.env.PAYFAST_PASSPHRASE || ''

    if (tenantId) {
      try {
        const { data: tenant } = await getSupabase()
          .from('tenants')
          .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
          .eq('id', tenantId)
          .single()

        if (tenant?.payfast_merchant_id) {
          merchantId = tenant.payfast_merchant_id
          merchantKey = tenant.payfast_merchant_key || merchantKey
          passPhrase = tenant.payfast_passphrase || passPhrase
        }
      } catch {
        // Fall back to env vars
      }
    }

    const mode = (process.env.NEXT_PUBLIC_PAYFAST_MODE as 'live' | 'sandbox') || 'live'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://awake-south-africa.vercel.app'

    const paymentUrl = mode === 'live'
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process'

    const data: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
      notify_url: `${baseUrl}/api/payfast/notify`,
      name_first: name,
      email_address: email,
      m_payment_id: paymentId || `AWK-${Date.now()}`,
      amount: parseFloat(amount).toFixed(2),
      item_name: itemName || 'Awake Boards SA Order',
      item_description: itemDescription || '',
      email_confirmation: '1',
      confirmation_address: email,
    }

    // Generate server-side signature with secret passphrase
    const signature = generatePayFastSignature(data, passPhrase)
    data.signature = signature

    return NextResponse.json({
      url: paymentUrl,
      data,
    })
  } catch (error: unknown) {
    console.error('PayFast create-payment error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
