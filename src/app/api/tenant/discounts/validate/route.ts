export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const explicit = new URL(request.url).searchParams.get('tenant_id')
  if (explicit) return explicit
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) return null
  const { data } = await sb().from('tenants').select('id').or(`subdomain.eq.${slug},slug.eq.${slug}`).eq('is_active', true).single()
  return data?.id || null
}

// POST /api/tenant/discounts/validate
// Body: { code: string, subtotal: number }
// Returns: { valid, id, type, value, discount_amount, message }
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ valid: false, message: 'Store not found' })

  const { code, subtotal = 0 } = await request.json()
  if (!code) return NextResponse.json({ valid: false, message: 'No code provided' })

  const { data: discount, error } = await sb()
    .from('discount_codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (error || !discount) return NextResponse.json({ valid: false, message: 'Invalid or expired code' })

  // Check expiry
  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, message: 'This code has expired' })
  }

  // Check max uses
  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
    return NextResponse.json({ valid: false, message: 'This code has reached its usage limit' })
  }

  // Check minimum order
  if (discount.min_order_zar && subtotal < discount.min_order_zar) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order of R${discount.min_order_zar} required`,
    })
  }

  const discount_amount = discount.type === 'percent'
    ? Math.round(subtotal * (discount.value / 100) * 100) / 100
    : Math.min(discount.value, subtotal)

  // Increment used_count
  await sb()
    .from('discount_codes')
    .update({ used_count: discount.used_count + 1 })
    .eq('id', discount.id)

  return NextResponse.json({
    valid: true,
    id: discount.id,
    type: discount.type,
    value: discount.value,
    discount_amount,
    message: discount.type === 'percent'
      ? `${discount.value}% off — saving R${discount_amount.toFixed(2)}`
      : `R${discount_amount.toFixed(2)} off`,
  })
}
