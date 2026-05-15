export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET — list reviews by approval status (admin only)
export async function GET(request: NextRequest) {
  const approved = new URL(request.url).searchParams.get('approved') === 'true'
  const tenantId = new URL(request.url).searchParams.get('tenant_id')

  let query = sb()
    .from('reviews')
    .select('*, products(name)')
    .eq('approved', approved)
    .order('created_at', { ascending: false })

  if (tenantId) query = query.eq('tenant_id', tenantId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reviews: data || [] })
}

// PATCH — approve a review
export async function PATCH(request: NextRequest) {
  const { id, approved } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await sb().from('reviews').update({ approved }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — remove a review
export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await sb().from('reviews').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
