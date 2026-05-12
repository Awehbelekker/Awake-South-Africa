export const dynamic = 'force-dynamic'

/**
 * POST /api/upload
 * Uploads a file to Supabase Storage and returns a permanent public URL.
 * Replaces the base64-to-localStorage approach in MediaManager.
 *
 * Body: multipart/form-data
 *   file      - the file to upload
 *   folder    - optional subfolder (default: "products")
 *   tenant_id - optional tenant UUID (falls back to awake-sa tenant)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'product-images'
const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function resolveTenantId(supabase: ReturnType<typeof getSupabase>, tenantId?: string | null): Promise<string> {
  if (tenantId && tenantId.length > 10) {
    const { data } = await supabase.from('tenants').select('id').eq('id', tenantId).single()
    if (data?.id) return data.id
  }
  const { data } = await supabase.from('tenants').select('id').eq('slug', 'awake-sa').single()
  return data?.id || 'default'
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'products'
    const tenantIdParam = formData.get('tenant_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB — max 50MB` },
        { status: 413 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 415 }
      )
    }

    const supabase = getSupabase()
    const tenantId = await resolveTenantId(supabase, tenantIdParam)

    // Build a safe, unique file path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const base = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 60)
    const timestamp = Date.now()
    const filePath = `${tenantId}/${folder}/${timestamp}-${base}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000', // 1 year — immutable uploads
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('Upload route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
