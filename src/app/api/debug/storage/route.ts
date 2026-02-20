export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check storage and list all files
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    const supabase = getSupabase()

    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        details: bucketsError,
      }, { status: 500 })
    }

    // List files in product-images bucket
    const { data: rootFiles, error: rootError } = await supabase.storage
      .from('product-images')
      .list('', { limit: 100 })

    const debug: any = {
      bucketsFound: buckets?.map(b => ({ name: b.name, public: b.public })) || [],
      productImagesBucket: rootFiles ? 'exists' : 'missing',
      rootFolders: rootFiles?.map(f => f.name) || [],
    }

    // If tenant_id provided, check their folders
    if (tenantId) {
      const { data: tenantRoot, error: tenantError } = await supabase.storage
        .from('product-images')
        .list(tenantId, { limit: 100 })

      debug.tenantFolder = {
        exists: !tenantError,
        subfolders: tenantRoot?.map(f => f.name) || [],
        error: tenantError?.message,
      }

      // Check media-library folder
      const { data: mediaLib, error: mediaError } = await supabase.storage
        .from('product-images')
        .list(`${tenantId}/media-library`, { limit: 100 })

      debug.mediaLibraryFolder = {
        exists: !mediaError,
        fileCount: mediaLib?.length || 0,
        files: mediaLib?.map(f => ({
          name: f.name,
          id: f.id,
          created: f.created_at,
          size: f.metadata?.size,
        })) || [],
        error: mediaError?.message,
      }

      // Check products folder
      const { data: products, error: productsError } = await supabase.storage
        .from('product-images')
        .list(`${tenantId}/products`, { limit: 100 })

      debug.productsFolder = {
        exists: !productsError,
        fileCount: products?.length || 0,
        files: products?.slice(0, 5).map(f => f.name) || [],
        error: productsError?.message,
      }
    }

    debug.env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    return NextResponse.json(debug)

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
