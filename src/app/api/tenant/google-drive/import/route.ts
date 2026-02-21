export const dynamic = 'force-dynamic'

/**
 * Google Drive Product Import API
 * 
 * POST - Import products from tenant's Google Drive folder
 * Lists files in Drive, creates product records with images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleDriveProvider } from '@/lib/cloud-storage/google-drive'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ImportRequest {
  tenant_id: string
  folder_id?: string // Optional: specific folder to import from
  category?: string // Optional: category to assign to imported products
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json()
    const { tenant_id, folder_id, category } = body

    // Resolve tenant with fallback to awake-sa
    const supabase = getSupabase()
    let tenant = null
    if (tenant_id && tenant_id !== 'undefined' && tenant_id.length > 10) {
      const { data } = await supabase.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, google_drive_folder_id, slug, name')
        .eq('id', tenant_id).single()
      tenant = data
    }
    if (!tenant) {
      const { data } = await supabase.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, google_drive_folder_id, slug, name')
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
        { error: 'Google Drive not connected for this tenant' },
        { status: 400 }
      )
    }

    // Initialize Google Drive provider
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!
    const driveProvider = new GoogleDriveProvider(
      {
        clientId,
        clientSecret,
        refreshToken: tenant.google_drive_refresh_token,
      },
      folder_id || tenant.google_drive_folder_id
    )

    // List images from Drive
    const folderToScan = folder_id || tenant.google_drive_folder_id || 'root'
    const result = await driveProvider.listFiles(folderToScan)

    if (!result || !result.files || result.files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images found in Drive folder',
        imported: 0,
      })
    }

    // Filter for image files only
    const imageFiles = result.files.filter((file: any) => 
      file.mimeType?.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No image files found',
        imported: 0,
      })
    }

    // Import each image as a product
    const imported = []
    const errors = []

    for (const file of imageFiles) {
      try {
        // Generate product slug from filename
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        const slug = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        // Check if product already exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('tenant_id', tenant_id)
          .eq('slug', slug)
          .single()

        if (existing) {
          errors.push({ file: file.name, error: 'Product with this slug already exists' })
          continue
        }

        // Create product record
        const productData = {
          tenant_id,
          slug,
          name: fileName,
          description: `Auto-imported from Google Drive: ${file.name}`,
          price: 0, // Tenant needs to set price
          currency: 'ZAR',
          category: category || 'uncategorized',
          images: [file.url || file.thumbnailUrl || ''],
          thumbnail: file.thumbnailUrl || file.url || '',
          in_stock: false, // Needs manual activation
          stock_quantity: 0,
          is_featured: false,
          metadata: {
            drive_file_id: file.id,
            drive_file_name: file.name,
            imported_at: new Date().toISOString(),
          },
        }

        const { data: product, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single()

        if (insertError) {
          errors.push({ file: file.name, error: insertError.message })
        } else {
          imported.push(product)
        }
      } catch (error: any) {
        errors.push({ file: file.name, error: error.message })
      }
    }

    // Update last sync timestamp
    await supabase
      .from('tenants')
      .update({ google_drive_last_sync: new Date().toISOString() })
      .eq('id', tenant_id)

    return NextResponse.json({
      success: true,
      message: `Imported ${imported.length} products from Google Drive`,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
      products: imported.map(p => ({ id: p.id, slug: p.slug, name: p.name })),
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import products', details: error.message },
      { status: 500 }
    )
  }
}

// GET - List available files in tenant's Drive folder (for preview)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const folderId = searchParams.get('folder_id')

    // Resolve tenant with fallback to awake-sa
    const supabase2 = getSupabase()
    let tenant2 = null
    if (tenantId && tenantId !== 'undefined' && tenantId.length > 10) {
      const { data } = await supabase2.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, google_drive_folder_id')
        .eq('id', tenantId).single()
      tenant2 = data
    }
    if (!tenant2) {
      const { data } = await supabase2.from('tenants')
        .select('id, google_drive_enabled, google_drive_refresh_token, google_drive_folder_id')
        .eq('slug', 'awake-sa').single()
      tenant2 = data
    }
    const tenant = tenant2

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

    // Initialize Google Drive provider
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!
    const driveProvider = new GoogleDriveProvider(
      {
        clientId,
        clientSecret,
        refreshToken: tenant.google_drive_refresh_token,
      },
      folderId || tenant.google_drive_folder_id
    )

    // List files
    const folderToScan = folderId || tenant.google_drive_folder_id || 'root'
    const result = await driveProvider.listFiles(folderToScan)

    // Filter for images only
    const imageFiles = result.files.filter((file: any) => 
      file.mimeType?.startsWith('image/')
    )

    return NextResponse.json({
      success: true,
      folder: folderToScan,
      totalFiles: result.files.length,
      imageFiles: imageFiles.length,
      files: imageFiles.map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        thumbnailUrl: f.thumbnailUrl,
        url: f.url,
      })),
    })

  } catch (error: any) {
    console.error('List files error:', error)
    return NextResponse.json(
      { error: 'Failed to list files', details: error.message },
      { status: 500 }
    )
  }
}
