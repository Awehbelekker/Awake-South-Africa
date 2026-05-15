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

// GET — list published posts (public) or all posts (?admin=true)
export async function GET(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const isAdmin = new URL(request.url).searchParams.get('admin') === 'true'

  let query = sb()
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, author, published, published_at, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (!isAdmin) query = query.eq('published', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data || [] })
}

// POST — create post
export async function POST(request: NextRequest) {
  const tenantId = await getTenantId(request)
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const body = await request.json()
  if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await sb()
    .from('blog_posts')
    .insert({
      tenant_id: tenantId,
      title: body.title,
      slug,
      content_html: body.content_html || '',
      excerpt: body.excerpt || '',
      featured_image: body.featured_image || null,
      author: body.author || 'Admin',
      published: body.published || false,
      published_at: body.published ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}
