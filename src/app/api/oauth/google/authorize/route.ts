export const dynamic = 'force-dynamic'

/**
 * Google OAuth Authorization Endpoint
 * 
 * Initiates OAuth flow for tenant to connect their Google Drive
 * Flow: Admin clicks "Connect Drive" → Redirects here → Google consent → Callback
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

    // Verify tenant exists
    const supabase = getSupabase()
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, slug, name')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Google OAuth configuration
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
    
    // Derive redirect URI from actual request origin (fixes Vercel deployment)
    const origin = new URL(request.url).origin
    const redirectUri = `${origin}/api/oauth/google/callback`
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Build OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly', // Read files
      'https://www.googleapis.com/auth/drive.file',     // Upload files
      'https://www.googleapis.com/auth/drive.metadata.readonly' // List files
    ]

    const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', scopes.join(' '))
    oauthUrl.searchParams.set('access_type', 'offline') // Get refresh token
    oauthUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
    oauthUrl.searchParams.set('state', tenantId) // Pass tenant ID through flow

    // Redirect to Google OAuth
    return NextResponse.redirect(oauthUrl.toString())

  } catch (error: any) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', details: error.message },
      { status: 500 }
    )
  }
}
