export const dynamic = 'force-dynamic'

/**
 * WhatsApp Webhook Handler
 *
 * GET  /api/webhooks/whatsapp  — Meta verification challenge
 * POST /api/webhooks/whatsapp  — Incoming messages from Meta or Twilio
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession, saveSession, handleMessage } from '@/lib/whatsapp-bot'
import { sendCustomWhatsApp } from '@/lib/whatsapp-service'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Meta verification handshake ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && challenge) {
    // Verify against any tenant that has this verify_token configured
    const { data } = await supabase()
      .from('tenants')
      .select('id')
      .filter('whatsapp_config->>meta_verify_token', 'eq', token)
      .limit(1)
      .single()

    if (data) {
      return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
}

// ── Incoming message handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Meta Cloud API format ─────────────────────────────────────────────
    if (body.object === 'whatsapp_business_account') {
      const entry   = body.entry?.[0]
      const changes = entry?.changes?.[0]
      const value   = changes?.value
      const message = value?.messages?.[0]

      if (message) {
        const from    = message.from                      // sender phone
        const text    = message.text?.body || ''
        const msgId   = message.id
        const phoneId = value.metadata?.phone_number_id  // our sending number

        // Find tenant by phone_number_id
        const { data: tenant } = await supabase()
          .from('tenants')
          .select('id, name')
          .filter('whatsapp_config->>meta_phone_number_id', 'eq', phoneId)
          .limit(1)
          .single()

        if (tenant && text) {
          // Store inbound message
          await supabase().from('whatsapp_messages').insert({
            tenant_id:    tenant.id,
            direction:    'inbound',
            from_number:  from,
            to_number:    phoneId,
            body:         text,
            provider:     'meta',
            provider_id:  msgId,
          }).maybeSingle()

          // Run commerce bot
          try {
            const session = await getSession(tenant.id, from)
            const { reply, session: newSession } = await handleMessage(session, text)
            await saveSession(newSession)
            await sendCustomWhatsApp({ to: from, message: reply, tenantId: tenant.id })
          } catch (botErr: any) {
            console.error('WhatsApp bot error:', botErr.message)
          }
        }
      }

      // Always return 200 to Meta — otherwise it retries
      return NextResponse.json({ status: 'ok' })
    }

    // ── Twilio format ─────────────────────────────────────────────────────
    if (body.AccountSid && body.From) {
      const from = body.From?.replace('whatsapp:', '')
      const to   = body.To?.replace('whatsapp:', '')
      const text = body.Body || ''
      const msgId = body.MessageSid

      // Find tenant by from number configured
      const { data: tenant } = await supabase()
        .from('tenants')
        .select('id')
        .filter('whatsapp_config->>twilio_from_number', 'eq', to)
        .limit(1)
        .single()

      if (tenant) {
        await supabase().from('whatsapp_messages').insert({
          tenant_id:   tenant.id,
          direction:   'inbound',
          from_number: from,
          to_number:   to,
          body:        text,
          provider:    'twilio',
          provider_id: msgId,
        }).maybeSingle()
      }

      // Twilio expects XML or 204
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ status: 'ignored' })
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
