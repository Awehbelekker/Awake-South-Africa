/**
 * Microsoft OAuth Callback Route
 * 
 * Handles the OAuth callback from Microsoft
 * Exchanges code for tokens and saves connection
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeMicrosoftCode,
  getMicrosoftUserInfo,
  saveMicrosoftConnection,
} from '@/lib/oauth/microsoft-oauth'
import { OAUTH_SCOPE_PRESETS } from '@/lib/oauth/types'
import type { OAuthConfig } from '@/lib/oauth/types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth error
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/settings/integrations?error=${error}`, request.url)
    )
  }

  // Validate code
  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/settings/integrations?error=missing_code', request.url)
    )
  }

  try {
    // Decode state to get tenant info
    const stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : {}
    const tenantId = stateData.tenantId

    if (!tenantId) {
      throw new Error('Missing tenant ID in state')
    }

    // OAuth configuration
    const config: OAuthConfig = {
      provider: 'microsoft',
      clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI!,
      scopes: OAUTH_SCOPE_PRESETS.microsoft.oneDriveAndCalendar,
    }

    // Exchange code for tokens
    const tokens = await exchangeMicrosoftCode(code, config)

    // Get user info
    const userInfo = await getMicrosoftUserInfo(tokens.accessToken)

    // Get current user ID (from session/cookie)
    // TODO: Implement proper session management
    const userId = 'current-user-id' // Placeholder

    // Save connection to database
    const result = await saveMicrosoftConnection(tokens, userInfo, tenantId, userId)

    if (!result.success) {
      throw new Error(result.error || 'Failed to save connection')
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/admin/settings/integrations?success=microsoft_connected', request.url)
    )
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error)
    return NextResponse.redirect(
      new URL(
        `/admin/settings/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'oauth_failed'
        )}`,
        request.url
      )
    )
  }
}

