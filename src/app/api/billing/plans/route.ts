export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_zar')
  return NextResponse.json(data || [])
}
