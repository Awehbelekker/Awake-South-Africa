export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  const tenantId = new URL(request.url).searchParams.get('tenant_id')
  let query = sb().from('quotes').select('*').order('created_at', { ascending: false })
  if (tenantId) query = query.eq('tenant_id', tenantId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ quotes: data || [] })
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await sb().from('quotes').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
