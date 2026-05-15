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
  if (!slug) {
    const { data } = await sb().from('tenants').select('id').eq('slug', 'awake-sa').single()
    return data?.id || null
  }
  const { data } = await sb().from('tenants').select('id').or(`subdomain.eq.${slug},slug.eq.${slug}`).eq('is_active', true).single()
  return data?.id || null
}

// GET — fetch single post by id or slug
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { data, error } = await sb()
    .from('blog_posts')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ post: data })
}

// PATCH — update post
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  const row: Record<string, any> = { updated_at: new Date().toISOString() }

  if (body.title !== undefined) row.title = body.title
  if (body.content_html !== undefined) row.content_html = body.content_html
  if (body.excerpt !== undefined) row.excerpt = body.excerpt
  if (body.featured_image !== undefined) row.featured_image = body.featured_image
  if (body.author !== undefined) row.author = body.author
  if (body.published !== undefined) {
    row.published = body.published
    if (body.published && !body.published_at) row.published_at = new Date().toISOString()
  }

  const { data, error } = await sb()
    .from('blog_posts')
    .update(row)
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

// DELETE
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { error } = await sb()
    .from('blog_posts')
    .delete()
    .eq('id', params.id)
    .eq('tenant_id', tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
