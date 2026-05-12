/**
 * WhatsApp message endpoint for admin-triggered messages.
 * Wraps sendCustomWhatsApp — handles registration codes, payment reminders, etc.
 * Requires an active admin session (tenant resolved from session).
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendCustomWhatsApp } from '@/lib/whatsapp-service'

export async function POST(req: NextRequest) {
  try {
    const { tenantId, to, message } = await req.json()

    if (!tenantId || !to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields', required: ['tenantId', 'to', 'message'] },
        { status: 400 }
      )
    }

    const result = await sendCustomWhatsApp({ tenantId, to, message })

    if (!result.success) {
      return NextResponse.json({ error: result.error, fallback: 'manual', manualMessage: message }, { status: 400 })
    }

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    )
  }
}
