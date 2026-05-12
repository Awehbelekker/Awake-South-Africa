/**
 * Tenant-aware WhatsApp notification service
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
  to: string                // recipient number in international format e.g. +27821234567
  template: WhatsAppTemplate
  vars: Record<string, string>
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

async function sendViaTwilio(config: WhatsAppConfig, to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const sid = config.twilio_account_sid
  const token = config.twilio_auth_token
  const from = config.twilio_from_number

  if (!sid || !token || !from) return { success: false, error: 'Twilio credentials incomplete' }

  const params = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: body,
  })

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

async function sendViaMeta(config: WhatsAppConfig, to: string, body: string): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = config.meta_phone_number_id
  const accessToken = config.meta_access_token

  if (!phoneNumberId || !accessToken) return { success: false, error: 'Meta credentials incomplete' }

  // Sending a free-form text message (only works within 24h window after customer messages)
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

export interface SendCustomWhatsAppOptions {
  tenantId: string
  to: string
  message: string
}

/**
 * Send a free-form message to any number using the tenant's configured provider.
 * Used for admin-triggered messages: registration codes, payment reminders, etc.
 * Note: Meta Cloud API free-form messages only work within 24h of customer contact.
 */
export async function sendCustomWhatsApp(opts: SendCustomWhatsAppOptions): Promise<{ success: boolean; error?: string }> {
  const { tenantId, to, message } = opts

  // Normalize phone: strip +, convert leading 0 to 27 (South Africa)
  let phone = to.replace(/[\s\-()]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  if (phone.startsWith('0')) phone = '27' + phone.slice(1)

  let config: WhatsAppConfig | null = null
  try {
    config = await getTenantWhatsAppConfig(tenantId)
  } catch {
    return { success: false, error: 'Could not load WhatsApp config' }
  }

  if (!config || !config.provider || config.provider === 'none') {
    return { success: false, error: 'WhatsApp provider not configured' }
  }

  if (config.provider === 'twilio') return sendViaTwilio(config, `+${phone}`, message)
  if (config.provider === 'meta')   return sendViaMeta(config, phone, message)

  return { success: false, error: `Unknown provider: ${config.provider}` }
}

export async function sendWhatsApp(opts: SendWhatsAppOptions): Promise<{ success: boolean; error?: string }> {
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
  if (config.provider === 'meta') return sendViaMeta(config, to, message)

  return { success: false, error: `Unknown provider: ${config.provider}` }
}
