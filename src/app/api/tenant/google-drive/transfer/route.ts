export const dynamic = 'force-dynamic'

/**
 * Transfer Google Drive Images to Supabase Storage
 * 
 * Downloads selected images from tenant's Drive and uploads to Supabase Storage
 * POST - Transfer selected files
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const data = await response.json()
  return data.access_token
}

async function downloadDriveFile(accessToken: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to download file from Drive')
  }

  return await response.arrayBuffer()
}

async function getFileMetadata(accessToken: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get file metadata')
  }

  return await response.json()
}

async function uploadToSupabase(
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  tenantId: string
) {
  const supabase = getSupabase()

  // Generate clean filename
  const timestamp = Date.now()
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
  const safeFileName = `${timestamp}-${cleanName}`

  // Upload to Supabase Storage
  const filePath = `${tenantId}/products/${safeFileName}`
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
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

  return {
    path: filePath,
    url: urlData.publicUrl,
  }
}

interface TransferRequest {
  tenant_id: string
  file_ids: string[] // Array of Drive file IDs to transfer
  create_products?: boolean // Whether to create product records
  category?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json()
    const { tenant_id, file_ids, create_products = false, category = 'uncategorized' } = body

    if (!file_ids || file_ids.length === 0) {
      return NextResponse.json(
        { error: 'Missing file_ids' },
        { status: 400 }
      )
    }

    // Resolve tenant with fallback to awake-sa
    const supabase = getSupabase()
    let tenant = null
    if (tenant_id && tenant_id !== 'undefined' && tenant_id.length > 10) {
      const { data } = await supabase.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, name')
        .eq('id', tenant_id).single()
      tenant = data
    }
    if (!tenant) {
      const { data } = await supabase.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, name')
        .eq('slug', 'awake-sa').single()
      tenant = data
    }

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    if (!tenant.google_drive_enabled || !tenant.google_drive_refresh_token) {
      return NextResponse.json(
        { error: 'Google Drive not connected' },
        { status: 400 }
      )
    }

    // Get access token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!
    const accessToken = await refreshAccessToken(
      clientId,
      clientSecret,
      tenant.google_drive_refresh_token
    )

    // Transfer each file
    const results: Array<{
      driveFileId: string
      driveName: string
      supabasePath: string
      supabaseUrl: string
      size: number
      productId?: string
    }> = []
    const errors: Array<{ fileId?: string; file?: string; error: string }> = []

    for (const fileId of file_ids) {
      try {
        // Get file metadata
        const metadata = await getFileMetadata(accessToken, fileId)

        // Download from Drive
        const fileBuffer = await downloadDriveFile(accessToken, fileId)

        // Upload to Supabase
        const supabaseFile = await uploadToSupabase(
          fileBuffer,
          metadata.name,
          metadata.mimeType,
          tenant_id
        )

        results.push({
          driveFileId: fileId,
          driveName: metadata.name,
          supabasePath: supabaseFile.path,
          supabaseUrl: supabaseFile.url,
          size: metadata.size,
        })

        // Create product if requested
        if (create_products) {
          const slug = metadata.name
            .replace(/\.[^/.]+$/, '') // Remove extension
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')

          const productData = {
            tenant_id,
            slug,
            name: metadata.name.replace(/\.[^/.]+$/, ''),
            description: `Imported from Google Drive: ${metadata.name}`,
            price: 0,
            currency: 'ZAR',
            category,
            images: [supabaseFile.url],
            thumbnail: supabaseFile.url,
            in_stock: false,
            stock_quantity: 0,
            is_featured: false,
            metadata: {
              drive_file_id: fileId,
              drive_file_name: metadata.name,
              imported_at: new Date().toISOString(),
              storage_location: 'supabase',
            },
          }

          const { data: product, error: productError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single()

          if (productError) {
            errors.push({
              file: metadata.name,
              error: `Image transferred but product creation failed: ${productError.message}`,
            })
          } else {
            results[results.length - 1].productId = product.id
          }
        }

      } catch (error: any) {
        errors.push({
          fileId,
          error: error.message,
        })
      }
    }

    // Update last sync timestamp
    await supabase
      .from('tenants')
      .update({ google_drive_last_sync: new Date().toISOString() })
      .eq('id', tenant_id)

    return NextResponse.json({
      success: true,
      message: `Transferred ${results.length} images to Supabase Storage`,
      transferred: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    })

  } catch (error: any) {
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to transfer images', details: error.message },
      { status: 500 }
    )
  }
}
