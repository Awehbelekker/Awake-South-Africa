export const dynamic = 'force-dynamic'

/**
 * Google Drive Disconnect API
 * 
 * POST - Disconnect tenant's Google Drive
 * Clears OAuth tokens and resets connection status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
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
    const { error } = await supabase
      .from('tenants')
      .update({
        google_drive_enabled: false,
        google_refresh_token: null,
        google_drive_folder_id: null,
      })
      .eq('id', tenantId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Google Drive disconnected successfully'
    })

  } catch (error: any) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect', details: error.message },
      { status: 500 }
    )
  }
}
