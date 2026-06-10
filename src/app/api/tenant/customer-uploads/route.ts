export const dynamic = 'force-dynamic'

/**
 * Customer Upload API
 * POST — accept file(s) from customer, store in Supabase Storage, save metadata
 * GET  — list uploads (admin, filtered by status)
 * PATCH — approve / reject an upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getTenantId(req: NextRequest): Promise<string> {
  const supabase = sb()
  const customDomain = req.headers.get('x-custom-domain')
  const isCustomDomain = req.headers.get('x-is-custom-domain') === 'true'
  const tenantSlug = req.headers.get('x-tenant-slug')

  if (isCustomDomain && customDomain) {
    const { data } = await supabase.from('tenants').select('id').eq('domain', customDomain).eq('is_active', true).single()
    if (data) return data.id
  }
  if (tenantSlug) {
    const { data } = await supabase.from('tenants').select('id').or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`).eq('is_active', true).single()
    if (data) return data.id
  }
  const { data } = await supabase.from('tenants').select('id').eq('slug', 'awake-sa').single()
  return data?.id || ''
}

// POST — upload file
export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    const formData = await req.formData()

    const file = formData.get('file') as File | null
    const name = (formData.get('name') as string) || 'Anonymous'
    const email = (formData.get('email') as string) || null
    const caption = (formData.get('caption') as string) || null
    const productId = (formData.get('product_id') as string) || null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    if (!isVideo && !isImage) return NextResponse.json({ error: 'Only images and videos accepted' }, { status: 400 })

    const maxSize = isVideo ? 500 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Max ${isVideo ? '500MB' : '20MB'}` }, { status: 400 })
    }

    const supabase = sb()
    const timestamp = Date.now()
    const ext = file.name.match(/\.[^/.]+$/)?.[0]?.toLowerCase() || (isVideo ? '.mp4' : '.jpg')
    const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().slice(0, 40)
    const filePath = `${tenantId}/customer-uploads/${timestamp}-${safeName}${ext}`

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, { contentType: file.type, cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    // Save metadata — create table if needed
    const { data: record, error: dbError } = await supabase
      .from('customer_uploads')
      .insert({
        tenant_id: tenantId,
        customer_name: name,
        customer_email: email,
        caption,
        product_id: productId || null,
        file_url: publicUrl,
        file_path: filePath,
        file_type: isVideo ? 'video' : 'image',
        file_size: file.size,
        status: 'pending',
      })
      .select('id')
      .single()

    if (dbError) {
      // Table may not exist yet — still return success (file is uploaded)
      console.warn('customer_uploads table missing:', dbError.message)
      return NextResponse.json({ success: true, url: publicUrl, id: null, note: 'Run SQL migration to enable full tracking' })
    }

    return NextResponse.json({ success: true, url: publicUrl, id: record.id })
  } catch (e: any) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET — list uploads for admin
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const supabase = sb()
    const query = supabase
      .from('customer_uploads')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (status !== 'all') query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ uploads: [], error: error.message })
    return NextResponse.json({ uploads: data || [] })
  } catch (e: any) {
    return NextResponse.json({ uploads: [], error: e.message })
  }
}

// PATCH — approve / reject / assign to product
export async function PATCH(req: NextRequest) {
  try {
    const tenantId = await getTenantId(req)
    const body = await req.json()
    const { id, status, product_id } = body

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = sb()
    const update: any = {}
    if (status) update.status = status
    if (product_id !== undefined) update.product_id = product_id

    const { error } = await supabase
      .from('customer_uploads')
      .update(update)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
