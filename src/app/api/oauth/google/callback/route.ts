export const dynamic = 'force-dynamic'

/**
 * Google OAuth Callback Endpoint
 * 
 * Handles OAuth redirect from Google with authorization code
 * Exchanges code for refresh token and stores in tenant record
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/google/callback`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return await response.json()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const tenantId = searchParams.get('state') // Tenant ID passed via state
    const error = searchParams.get('error')

    // Handle OAuth denial
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_denied`
      )
    }

    if (!code || !tenantId) {
      return NextResponse.json(
        { error: 'Missing code or tenant ID' },
        { status: 400 }
      )
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code)
    
    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token received. User may have already authorized.' },
        { status: 400 }
      )
    }

    // Store refresh token in tenant record
    const supabase = getSupabase()
    const { error: updateError, data: updateData } = await supabase
      .from('tenants')
      .update({
        google_drive_enabled: true,
        google_drive_refresh_token: tokens.refresh_token,
      })
      .eq('id', tenantId)
      .select('id, google_drive_enabled')

    if (updateError) {
      console.error('Failed to store refresh token:', JSON.stringify(updateError))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/admin/import?error=save_failed&message=${encodeURIComponent(updateError.message)}`
      )
    }

    console.log('Google Drive connected for tenant', tenantId, updateData)

    // Success! Redirect back to admin import page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/import?google_drive=connected`
    )

  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/admin/settings?error=oauth_failed&message=${encodeURIComponent(error.message)}`
    )
  }
}
