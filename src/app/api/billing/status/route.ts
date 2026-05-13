/**
 * GET /api/billing/status?tenantId=xxx
 * Returns current subscription status + plan for a tenant.
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 })

  const supabase = getSupabase()
  const { data } = await supabase
    .from('tenant_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('tenant_id', tenantId)
    .single()

  if (!data) {
    return NextResponse.json({ status: 'none', plan: null })
  }

  const now     = new Date()
  const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null
  const isTrialExpired = trialEnd ? now > trialEnd : false

  return NextResponse.json({
    status:       isTrialExpired && data.status === 'trial' ? 'expired' : data.status,
    plan:         data.plan,
    trialEndsAt:  data.trial_ends_at,
    periodEnd:    data.current_period_end,
    payfastToken: !!data.payfast_token,
  })
}
