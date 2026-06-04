export const dynamic = 'force-dynamic'

/**
 * GET  /api/tenant/whatsapp/broadcast  — list past broadcasts
 * POST /api/tenant/whatsapp/broadcast  — create and immediately send a broadcast
 *   Body: { name, message, imageUrl?, tagsFilter? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBroadcast } from '@/lib/whatsapp-service'

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

    const { data, error } = await db()
      .from('whatsapp_broadcasts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ broadcasts: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const body = await request.json()
    const { name, message, imageUrl, tagsFilter } = body

    if (!name || !message) {
      return NextResponse.json({ error: 'name and message are required' }, { status: 400 })
    }

    // Create the broadcast record
    const { data: broadcast, error: createErr } = await db()
      .from('whatsapp_broadcasts')
      .insert({
        tenant_id: tenantId,
        name,
        message,
        image_url: imageUrl || null,
        tags_filter: tagsFilter || [],
        status: 'sending',
      })
      .select()
      .single()

    if (createErr || !broadcast) throw createErr || new Error('Failed to create broadcast')

    // Fire off broadcast — runs synchronously (Vercel functions allow up to 60s)
    const result = await sendBroadcast({
      tenantId,
      broadcastId: broadcast.id,
      message,
      imageUrl,
      tagsFilter,
    })

    return NextResponse.json({
      broadcastId: broadcast.id,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.slice(0, 10), // cap error list in response
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
