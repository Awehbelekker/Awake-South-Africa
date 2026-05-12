export const dynamic = 'force-dynamic'

/**
 * Proxy to MASS AI search service.
 * POST /api/ai/search  →  MASS /search
 *
 * Body: { query: string, context?: object, max_results?: number }
 * Returns: { query, results, synthesis, intent, agent_trace, model }
 */

import { NextRequest, NextResponse } from 'next/server'

const MASS_URL = process.env.MASS_API_URL
const MASS_KEY = process.env.MASS_API_KEY

export async function POST(request: NextRequest) {
  if (!MASS_URL) {
    return NextResponse.json(
      { error: 'MASS_API_URL not configured. Deploy the universal-mass-framework service first.' },
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

    const res = await fetch(`${MASS_URL}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: body.query,
        context: body.context ?? null,
        max_results: body.max_results ?? 10,
      }),
      signal: AbortSignal.timeout(30000),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
