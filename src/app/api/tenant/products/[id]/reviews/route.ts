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

// GET — approved reviews for a product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data, error } = await sb()
    .from('reviews')
    .select('id, customer_name, rating, body, created_at')
    .eq('product_id', params.id)
    .eq('tenant_id', tenantId)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const reviews = data || []
  const avg = reviews.length > 0
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({ reviews, average: Math.round(avg * 10) / 10, count: reviews.length })
}

// POST — submit a new review (pending approval)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  if (!body.customer_email || !body.customer_name || !body.rating) {
    return NextResponse.json({ error: 'name, email, and rating are required' }, { status: 400 })
  }
  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }

  const { error } = await sb()
    .from('reviews')
    .insert({
      tenant_id: tenantId,
      product_id: params.id,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      rating: body.rating,
      body: body.body || '',
      approved: false,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message: 'Review submitted and awaiting approval' }, { status: 201 })
}
