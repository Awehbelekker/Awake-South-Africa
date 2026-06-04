/**
 * Tenant-aware WhatsApp notification + broadcast service.
 * Dispatches via Twilio or Meta Cloud API based on tenant's whatsapp_config.
 */

import { createClient } from '@supabase/supabase-js'
import { renderTemplate } from './email-service'

interface WhatsAppConfig {
  phone_number?: string
  provider?: 'none' | 'twilio' | 'meta' | ''
  twilio_account_sid?: string
  twilio_auth_token?: string
  twilio_from_number?: string
  meta_phone_number_id?: string
  meta_access_token?: string
  meta_verify_token?: string
  template_order_confirmed?: string
  template_order_shipped?: string
  template_order_ready?: string
}

export type WhatsAppTemplate = 'order_confirmed' | 'order_shipped' | 'order_ready'

export interface SendWhatsAppOptions {
  tenantId: string
  to: string
  template: WhatsAppTemplate
  vars: Record<string, string>
}

export interface SendCustomWhatsAppOptions {
  tenantId: string
  to: string
  message: string
  imageUrl?: string
}

export interface BroadcastOptions {
  tenantId: string
  broadcastId: string
  message: string
  imageUrl?: string
  tagsFilter?: string[]
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantWhatsAppConfig(tenantId: string): Promise<WhatsAppConfig | null> {
  const { data } = await supabase()
    .from('tenants')
    .select('whatsapp_config')
    .eq('id', tenantId)
    .single()
  return data?.whatsapp_config || null
}

function getTemplateBody(config: WhatsAppConfig, template: WhatsAppTemplate): string {
  const defaults: Record<WhatsAppTemplate, string> = {
    order_confirmed: 'Hi {{name}}, your order {{order_id}} is confirmed! Total: {{total}}.',
    order_shipped:   'Hi {{name}}, your order {{order_id}} is on its way!',
    order_ready:     'Hi {{name}}, your order {{order_id}} is ready for collection.',
  }
  const stored = {
    order_confirmed: config.template_order_confirmed,
    order_shipped:   config.template_order_shipped,
    order_ready:     config.template_order_ready,
  }
  return stored[template] || defaults[template]
}

// ── Twilio ────────────────────────────────────────────────────────────────────

async function sendViaTwilio(
  config: WhatsAppConfig,
  to: string,
  body: string,
  mediaUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const sid   = config.twilio_account_sid
  const token = config.twilio_auth_token
  const from  = config.twilio_from_number

  if (!sid || !token || !from) return { success: false, error: 'Twilio credentials incomplete' }

  const params = new URLSearchParams({ From: `whatsapp:${from}`, To: `whatsapp:${to}`, Body: body })
  if (mediaUrl) params.set('MediaUrl', mediaUrl)

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err.message || 'Twilio error' }
  }
  return { success: true }
}

// ── Meta Cloud API ────────────────────────────────────────────────────────────

async function sendViaMeta(
  config: WhatsAppConfig,
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = config.meta_phone_number_id
  const accessToken   = config.meta_access_token

  if (!phoneNumberId || !accessToken) return { success: false, error: 'Meta credentials incomplete' }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err.error?.message || 'Meta API error' }
  }
  return { success: true }
}

/**
 * Send an image + optional caption via Meta Cloud API.
 * Image must be a publicly accessible URL.
 */
async function sendImageViaMeta(
  config: WhatsAppConfig,
  to: string,
  imageUrl: string,
  caption?: string
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = config.meta_phone_number_id
  const accessToken   = config.meta_access_token

  if (!phoneNumberId || !accessToken) return { success: false, error: 'Meta credentials incomplete' }

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption: caption || '' },
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return { success: false, error: err.error?.message || 'Meta image send error' }
  }
  return { success: true }
}

// ── Phone normalizer ──────────────────────────────────────────────────────────

export function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s\-()]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  if (phone.startsWith('0')) phone = '27' + phone.slice(1)
  return phone
}

// ── Public send functions ─────────────────────────────────────────────────────

/**
 * Send a free-form or image message to a single number.
 * Meta free-form only works within the 24-hour customer service window.
 * For marketing outside that window use sendBroadcast with approved templates.
 */
export async function sendCustomWhatsApp(
  opts: SendCustomWhatsAppOptions
): Promise<{ success: boolean; error?: string }> {
  const { tenantId, to, message, imageUrl } = opts
  const phone = normalizePhone(to)

  let config: WhatsAppConfig | null = null
  try {
    config = await getTenantWhatsAppConfig(tenantId)
  } catch {
    return { success: false, error: 'Could not load WhatsApp config' }
  }

  if (!config || !config.provider || config.provider === 'none') {
    return { success: false, error: 'WhatsApp provider not configured' }
  }

  if (config.provider === 'twilio') return sendViaTwilio(config, `+${phone}`, message, imageUrl)

  if (config.provider === 'meta') {
    if (imageUrl) {
      // Send image first, then text caption as separate message if needed
      const imgResult = await sendImageViaMeta(config, phone, imageUrl, message)
      return imgResult
    }
    return sendViaMeta(config, phone, message)
  }

  return { success: false, error: `Unknown provider: ${config.provider}` }
}

export async function sendWhatsApp(
  opts: SendWhatsAppOptions
): Promise<{ success: boolean; error?: string }> {
  const { tenantId, to, template, vars } = opts

  let config: WhatsAppConfig | null = null
  try {
    config = await getTenantWhatsAppConfig(tenantId)
  } catch {
    return { success: false, error: 'Could not load WhatsApp config' }
  }

  if (!config || !config.provider || config.provider === 'none') {
    return { success: false, error: 'WhatsApp provider not configured' }
  }

  const bodyTemplate = getTemplateBody(config, template)
  const message = renderTemplate(bodyTemplate, vars)

  if (config.provider === 'twilio') return sendViaTwilio(config, to, message)
  if (config.provider === 'meta')   return sendViaMeta(config, to, message)

  return { success: false, error: `Unknown provider: ${config.provider}` }
}

/**
 * Send a broadcast to all opted-in contacts for a tenant.
 * Rate-limited to 10 messages/second (Meta allows up to 80/s on verified accounts).
 * Updates whatsapp_broadcasts status and per-recipient records in real time.
 */
export async function sendBroadcast(opts: BroadcastOptions): Promise<{
  sent: number
  failed: number
  errors: string[]
}> {
  const { tenantId, broadcastId, message, imageUrl, tagsFilter } = opts
  const db = supabase()

  const config = await getTenantWhatsAppConfig(tenantId)
  if (!config || !config.provider || config.provider === 'none') {
    await db.from('whatsapp_broadcasts').update({ status: 'failed' }).eq('id', broadcastId)
    return { sent: 0, failed: 0, errors: ['WhatsApp provider not configured'] }
  }

  // Load opted-in contacts (optionally filtered by tags)
  let query = db
    .from('whatsapp_contacts')
    .select('id, phone, name')
    .eq('tenant_id', tenantId)
    .eq('opted_in', true)

  if (tagsFilter && tagsFilter.length > 0) {
    query = query.overlaps('tags', tagsFilter)
  }

  const { data: contacts, error: contactsErr } = await query
  if (contactsErr || !contacts || contacts.length === 0) {
    await db.from('whatsapp_broadcasts').update({ status: 'failed' }).eq('id', broadcastId)
    return { sent: 0, failed: 0, errors: ['No contacts found'] }
  }

  // Stamp broadcast as sending with recipient count
  await db.from('whatsapp_broadcasts').update({
    status: 'sending',
    recipient_count: contacts.length,
  }).eq('id', broadcastId)

  // Insert pending recipient rows
  await db.from('whatsapp_broadcast_recipients').insert(
    contacts.map((c: any) => ({
      broadcast_id: broadcastId,
      contact_id: c.id,
      phone: c.phone,
      status: 'pending',
    }))
  )

  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const contact of contacts as any[]) {
    const phone = normalizePhone(contact.phone)

    let result: { success: boolean; error?: string }

    if (config.provider === 'meta') {
      result = imageUrl
        ? await sendImageViaMeta(config, phone, imageUrl, message)
        : await sendViaMeta(config, phone, message)
    } else if (config.provider === 'twilio') {
      result = await sendViaTwilio(config, `+${phone}`, message, imageUrl)
    } else {
      result = { success: false, error: 'Unknown provider' }
    }

    const now = new Date().toISOString()

    if (result.success) {
      sent++
      await db.from('whatsapp_broadcast_recipients')
        .update({ status: 'sent', sent_at: now })
        .eq('broadcast_id', broadcastId)
        .eq('contact_id', contact.id)

      await db.from('whatsapp_contacts')
        .update({ last_messaged_at: now })
        .eq('id', contact.id)
    } else {
      failed++
      if (result.error) errors.push(`${phone}: ${result.error}`)
      await db.from('whatsapp_broadcast_recipients')
        .update({ status: 'failed', error: result.error || 'unknown' })
        .eq('broadcast_id', broadcastId)
        .eq('contact_id', contact.id)
    }

    // ~10 messages/second rate limit
    await new Promise(r => setTimeout(r, 100))
  }

  await db.from('whatsapp_broadcasts').update({
    status: 'sent',
    sent_count: sent,
    failed_count: failed,
    sent_at: new Date().toISOString(),
  }).eq('id', broadcastId)

  return { sent, failed, errors }
}
