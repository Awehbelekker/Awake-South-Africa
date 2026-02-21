export const dynamic = 'force-dynamic'

/**
 * Google Drive Status API
 * 
 * GET - Check if tenant has connected their Google Drive
 * Returns connection status, last sync time, folder ID
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

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant_id parameter' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('google_drive_enabled, google_drive_folder_id')
      .eq('id', tenantId)
      .single()

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      connected: tenant.google_drive_enabled || false,
      folderId: tenant.google_drive_folder_id,
    })

  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: error.message },
      { status: 500 }
    )
  }
}
