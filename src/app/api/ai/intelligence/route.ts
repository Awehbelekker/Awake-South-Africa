export const dynamic = 'force-dynamic'

/**
 * Proxy to MASS competitive intelligence endpoint.
 * POST /api/ai/intelligence  →  MASS /intelligence
 *
 * Owner-only — scrapes competitor pages and returns a pricing/positioning analysis.
 * Body: { query: string, context?: object }
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const MASS_URL = process.env.MASS_API_URL
const MASS_KEY = process.env.MASS_API_KEY

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!(cookieStore.get('master_admin_auth') || cookieStore.get('admin_session'))
}

export async function POST(request: NextRequest) {
  if (!await isAuthorized()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!MASS_URL) {
    return NextResponse.json(
      { error: 'MASS_API_URL not configured.' },
      { status: 503 }
    )
  }

  const body = await request.json()
  if (!body.query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (MASS_KEY) headers['X-Api-Key'] = MASS_KEY

    const res = await fetch(`${MASS_URL}/intelligence`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: body.query,
        context: body.context ?? null,
        max_results: body.max_results ?? 10,
      }),
      signal: AbortSignal.timeout(45000),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
