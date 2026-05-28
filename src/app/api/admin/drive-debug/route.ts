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
  return NextResponse.json({
    enabled: data?.google_drive_enabled,
    tokenPresent: !!token,
    tokenLength: token?.length ?? 0,
    tokenPrefix: token ? token.slice(0, 8) : null,  // first 8 chars only
    clientIdSet: !!(process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID && process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID !== 'PLACEHOLDER'),
    clientSecretSet: !!(process.env.GOOGLE_DRIVE_CLIENT_SECRET && process.env.GOOGLE_DRIVE_CLIENT_SECRET !== 'PLACEHOLDER'),
  })
}
