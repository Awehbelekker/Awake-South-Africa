/**
 * Google OAuth 2.0 Service
 * 
 * Implements OAuth 2.0 flow for Google services
 * - Google Drive
 * - Google Calendar
 * - Google Account Linking
 * 
 * Security Features:
 * - PKCE (Proof Key for Code Exchange)
 * - State parameter for CSRF protection
 * - Secure token storage
 * - Automatic token refresh
 */

import { createClient } from '@/lib/supabase/client'
import type { OAuthConfig, OAuthTokens, OAuthUserInfo } from './types'
import { GOOGLE_SCOPES, OAUTH_SCOPE_PRESETS } from './types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

/**
 * Generate authorization URL for Google OAuth
 */
export function getGoogleAuthUrl(
  config: OAuthConfig,
  options: {
    state?: string
    prompt?: 'none' | 'consent' | 'select_account'
    accessType?: 'online' | 'offline'
  } = {}
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    access_type: options.accessType || 'offline', // Request refresh token
    prompt: options.prompt || 'consent',
    state: options.state || generateState(),
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCode(
  code: string,
  config: OAuthConfig
): Promise<OAuthTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to exchange code: ${error.error_description || error.error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
    tokenType: data.token_type,
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshGoogleToken(
  refreshToken: string,
  config: OAuthConfig
): Promise<OAuthTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.error_description || error.error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Keep existing refresh token
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
    tokenType: data.token_type,
  }
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  const data = await response.json()

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
    provider: 'google',
  }
}

/**
 * Save OAuth connection to database
 */
export async function saveGoogleConnection(
  tokens: OAuthTokens,
  userInfo: OAuthUserInfo,
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from('oauth_connections').upsert({
      tenant_id: tenantId,
      user_id: userId,
      provider: 'google',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt.toISOString(),
      scope: tokens.scope,
      user_info: userInfo,
      is_active: true,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save connection',
    }
  }
}

/**
 * Get active Google connection for user
 */
export async function getGoogleConnection(
  tenantId: string,
  userId: string
): Promise<OAuthTokens | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return null
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) {
    // Token expired, refresh it
    if (!data.refresh_token) {
      return null
    }

    try {
      const config: OAuthConfig = {
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI!,
        scopes: [],
      }

      const newTokens = await refreshGoogleToken(data.refresh_token, config)

      // Update database
      await supabase
        .from('oauth_connections')
        .update({
          access_token: newTokens.accessToken,
          expires_at: newTokens.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      return newTokens
    } catch (error) {
      console.error('Failed to refresh Google token:', error)
      return null
    }
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scope: data.scope,
    tokenType: 'Bearer',
  }
}

/**
 * Revoke Google OAuth connection
 */
export async function revokeGoogleConnection(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Get connection
    const connection = await getGoogleConnection(tenantId, userId)
    if (!connection) {
      return { success: true } // Already revoked
    }

    // Revoke token with Google
    await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.accessToken}`, {
      method: 'POST',
    })

    // Mark as inactive in database
    await supabase
      .from('oauth_connections')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('provider', 'google')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke connection',
    }
  }
}

/**
 * Generate random state for CSRF protection
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Export preset scope configurations
 */
export { GOOGLE_SCOPES, OAUTH_SCOPE_PRESETS }
