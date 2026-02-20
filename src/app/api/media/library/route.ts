export const dynamic = 'force-dynamic'

/**
 * Media Library API
 * 
 * GET - List all media files for tenant
 * POST - Upload new media to library
 * DELETE - Remove media file
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// List all media for tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const folder = searchParams.get('folder') || 'media-library'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant_id parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // List all files in tenant's media library folder
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list(`${tenantId}/${folder}`, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      console.error('Supabase storage list error:', {
        error,
        tenantId,
        folder,
        bucket: 'product-images',
        path: `${tenantId}/${folder}`,
      })
      throw error
    }

    console.log('Media library files found:', {
      tenantId,
      folder,
      fileCount: files?.length || 0,
      files: files?.map(f => ({ name: f.name, id: f.id })),
    })

    // Get public URLs for each file
    const mediaFiles = files
      .filter(file => file.id !== null && !file.name.includes('/')) // Filter out folder entries, keep only files
      .map(file => {
        const filePath = `${tenantId}/${folder}/${file.name}`
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        return {
          id: file.id || file.name,
          name: file.name,
          path: filePath,
          url: urlData.publicUrl,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
        }
      })

    return NextResponse.json({
      success: true,
      files: mediaFiles,
      total: mediaFiles.length,
    })

  } catch (error: any) {
    console.error('Media library error:', error)
    return NextResponse.json(
      { error: 'Failed to load media library', details: error.message },
      { status: 500 }
    )
  }
}

// Upload media to library
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const tenantId = formData.get('tenant_id') as string
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'media-library'

    if (!tenantId || !file) {
      return NextResponse.json(
        { error: 'Missing tenant_id or file' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Generate unique filename
    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
    const fileName = `${timestamp}-${cleanName}`
    const filePath = `${tenantId}/${folder}/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        path: filePath,
        url: urlData.publicUrl,
        size: file.size,
      },
    })

  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload media', details: error.message },
      { status: 500 }
    )
  }
}

// Delete media from library
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const filePath = searchParams.get('file_path')

    if (!tenantId || !filePath) {
      return NextResponse.json(
        { error: 'Missing tenant_id or file_path' },
        { status: 400 }
      )
    }

    // Verify file belongs to tenant (security check)
    if (!filePath.startsWith(tenantId)) {
      return NextResponse.json(
        { error: 'Unauthorized: File does not belong to this tenant' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })

  } catch (error: any) {
    console.error('Media delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete media', details: error.message },
      { status: 500 }
    )
  }
}
