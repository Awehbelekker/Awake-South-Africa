export const dynamic = 'force-dynamic'

/**
 * GET  /api/tenant/whatsapp/contacts  — list contacts for this tenant
 * POST /api/tenant/whatsapp/contacts  — add one or bulk-import contacts
 *   Single:  { phone, name?, tags?, notes? }
 *   Bulk:    { contacts: [{ phone, name?, tags? }] }
 *   Opt-out: { phone, opted_in: false }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizePhone } from '@/lib/whatsapp-service'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function resolveTenantId(request: NextRequest): Promise<string | null> {
  const supabase = db()
  const explicit = new URL(request.url).searchParams.get('tenant_id')
  if (explicit) return explicit

  const slug = request.headers.get('x-tenant-slug')
  if (slug) {
    const { data } = await supabase
      .from('tenants').select('id')
      .or(`subdomain.eq.${slug},slug.eq.${slug}`)
      .eq('is_active', true).single()
    if (data) return data.id
  }

  const { data } = await supabase.from('tenants').select('id').eq('slug', 'awake-sa').single()
  return data?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const tag      = searchParams.get('tag')
    const optedIn  = searchParams.get('opted_in')
    const search   = searchParams.get('search')

    let query = db()
      .from('whatsapp_contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (optedIn !== null) query = query.eq('opted_in', optedIn === 'true')
    if (tag) query = query.contains('tags', [tag])
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ contacts: data || [], count: data?.length || 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const supabase = db()

    // Bulk import
    if (Array.isArray(body.contacts)) {
      const rows = body.contacts.map((c: any) => ({
        tenant_id: tenantId,
        phone: normalizePhone(c.phone),
        name: c.name || null,
        tags: c.tags || [],
        notes: c.notes || null,
        opted_in: true,
      }))

      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .upsert(rows, { onConflict: 'tenant_id,phone', ignoreDuplicates: false })
        .select('id')

      if (error) throw error
      return NextResponse.json({ imported: data?.length || rows.length })
    }

    // Single contact add or opt-out
    if (!body.phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

    const phone = normalizePhone(body.phone)

    if (body.opted_in === false) {
      await supabase.from('whatsapp_contacts').upsert({
        tenant_id: tenantId,
        phone,
        opted_in: false,
        opted_out_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,phone' })
      return NextResponse.json({ success: true, action: 'opted_out' })
    }

    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .upsert({
        tenant_id: tenantId,
        phone,
        name: body.name || null,
        tags: body.tags || [],
        notes: body.notes || null,
        opted_in: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,phone' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ contact: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await db()
      .from('whatsapp_contacts')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
