export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  const tenantId = new URL(request.url).searchParams.get('tenant_id')

  let query = sb()
    .from('whatsapp_sessions')
    .select('*')
    .order('last_activity', { ascending: false })
    .limit(100)

  if (tenantId) query = query.eq('tenant_id', tenantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data || [] })
}
