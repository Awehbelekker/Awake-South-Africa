/**
 * Microsoft OAuth 2.0 Service
 * 
 * Implements OAuth 2.0 flow for Microsoft services
 * - OneDrive
 * - Microsoft Calendar (Outlook)
 * - Microsoft Account Linking
 * 
 * Uses Microsoft Identity Platform (v2.0)
 */

import { createClient } from '@/lib/supabase/client'
import type { OAuthConfig, OAuthTokens, OAuthUserInfo } from './types'
import { MICROSOFT_SCOPES, OAUTH_SCOPE_PRESETS } from './types'

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const MICROSOFT_GRAPH_URL = 'https://graph.microsoft.com/v1.0'

/**
 * Generate authorization URL for Microsoft OAuth
 */
export function getMicrosoftAuthUrl(
  config: OAuthConfig,
  options: {
    state?: string
    prompt?: 'login' | 'consent' | 'select_account'
  } = {}
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    response_mode: 'query',
    prompt: options.prompt || 'consent',
    state: options.state || generateState(),
  })

  return `${MICROSOFT_AUTH_URL}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeMicrosoftCode(
  code: string,
  config: OAuthConfig
): Promise<OAuthTokens> {
  const response = await fetch(MICROSOFT_TOKEN_URL, {
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
export async function refreshMicrosoftToken(
  refreshToken: string,
  config: OAuthConfig
): Promise<OAuthTokens> {
  const response = await fetch(MICROSOFT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      scope: config.scopes.join(' '),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to refresh token: ${error.error_description || error.error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scope: data.scope,
    tokenType: data.token_type,
  }
}

/**
 * Get user info from Microsoft Graph
 */
export async function getMicrosoftUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const response = await fetch(`${MICROSOFT_GRAPH_URL}/me`, {
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
    email: data.mail || data.userPrincipalName,
    name: data.displayName,
    provider: 'microsoft',
  }
}

/**
 * Save OAuth connection to database
 */
export async function saveMicrosoftConnection(
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
      provider: 'microsoft',
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
 * Get active Microsoft connection for user
 */
export async function getMicrosoftConnection(
  tenantId: string,
  userId: string
): Promise<OAuthTokens | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('provider', 'microsoft')
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
        provider: 'microsoft',
        clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI!,
        scopes: data.scope.split(' '),
      }

      const newTokens = await refreshMicrosoftToken(data.refresh_token, config)

      // Update database
      await supabase
        .from('oauth_connections')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_at: newTokens.expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      return newTokens
    } catch (error) {
      console.error('Failed to refresh Microsoft token:', error)
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
 * Revoke Microsoft OAuth connection
 */
export async function revokeMicrosoftConnection(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Mark as inactive in database
    await supabase
      .from('oauth_connections')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('provider', 'microsoft')

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
export { MICROSOFT_SCOPES, OAUTH_SCOPE_PRESETS }
