export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase
    .from('tenant_subscriptions')
    .select(`
      tenant_id,
      status,
      trial_ends_at,
      current_period_end,
      payfast_token,
      plan:subscription_plans(name, display_name, price_zar),
      tenant:tenants(name, slug)
    `)
    .order('created_at', { ascending: false })

  if (!data) return NextResponse.json([])

  return NextResponse.json(data.map((s: any) => ({
    tenant_id:    s.tenant_id,
    tenant_name:  s.tenant?.name || 'Unknown',
    tenant_slug:  s.tenant?.slug || '',
    status:       s.status,
    plan_name:    s.plan?.name || '',
    plan_display: s.plan?.display_name || '',
    price_zar:    s.plan?.price_zar || 0,
    period_end:   s.current_period_end,
    trial_ends_at: s.trial_ends_at,
  })))
}
