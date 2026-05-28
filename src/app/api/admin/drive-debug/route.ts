export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('tenants')
    .select('id, google_drive_enabled, google_drive_refresh_token')
    .eq('id', '904f8826-d36d-4075-afb7-d178048b6b20')
    .single()

  if (error) return NextResponse.json({ error: error.message })

  const token = data?.google_drive_refresh_token
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!

  // Try the actual token refresh
  let refreshResult: any = null
  if (token) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token,
        grant_type: 'refresh_token',
      }),
    })
    refreshResult = await res.json()
    // Don't expose the access token
    if (refreshResult.access_token) refreshResult.access_token = '***valid***'
  }

  return NextResponse.json({
    enabled: data?.google_drive_enabled,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token ? token.slice(0, 8) : null,
    clientIdPrefix: clientId.slice(0, 12),
    refreshResult,
  })
}
