export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBalance, awardPoints, redeemPoints, getTier, pointsForNextTier, TIERS } from '@/lib/stoke-points'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const explicit = new URL(request.url).searchParams.get('tenant_id')
  if (explicit) return explicit
  const slug = request.headers.get('x-tenant-slug')
  if (!slug) {
    const { data } = await sb().from('tenants').select('id').eq('slug', 'awake-sa').single()
    return data?.id || null
  }
  const { data } = await sb().from('tenants').select('id').or(`subdomain.eq.${slug},slug.eq.${slug}`).eq('is_active', true).single()
  return data?.id || null
}

// GET /api/tenant/stoke?email=xxx — get balance + history
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const email = new URL(request.url).searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const balance = await getBalance(tenantId, email)
  const tierInfo = getTier(balance.points)
  const { next, needed } = pointsForNextTier(balance.points)

  // Get recent transactions
  const { data: transactions } = await sb()
    .from('stoke_transactions')
    .select('points, reason, created_at')
    .eq('tenant_id', tenantId)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    points: balance.points,
    total_earned: balance.total_earned,
    tier: tierInfo,
    next_tier: next,
    points_to_next: needed,
    transactions: transactions || [],
  })
}

// POST /api/tenant/stoke — redeem points
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { email, action, points, order_id, reason } = await request.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  if (action === 'award') {
    await awardPoints(tenantId, email, points, reason || 'manual', order_id)
    return NextResponse.json({ success: true })
  }

  if (action === 'redeem') {
    const result = await redeemPoints(tenantId, email, points)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    const discount = points / 10 // 10 points = R1 discount
    return NextResponse.json({ success: true, discount_amount: discount })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
