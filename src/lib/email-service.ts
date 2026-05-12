/**
 * Tenant-aware email service
 * Reads email_config from the tenant's Supabase row and dispatches via
 * SMTP (nodemailer), SendGrid, or Resend — falling back to env SMTP vars.
 */

import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export interface SendEmailOptions {
  tenantId: string
  to: string
  subject: string
  html: string
  replyTo?: string
}

interface EmailConfig {
  provider?: 'smtp' | 'sendgrid' | 'resend' | ''
  sender_name?: string
  sender_email?: string
  reply_to?: string
  smtp_host?: string
  smtp_port?: string
  smtp_secure?: boolean
  smtp_user?: string
  smtp_password?: string
  api_key?: string
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantEmailConfig(tenantId: string): Promise<EmailConfig | null> {
  const { data } = await supabase()
    .from('tenants')
    .select('email_config')
    .eq('id', tenantId)
    .single()
  return data?.email_config || null
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { tenantId, to, subject, html, replyTo } = opts

  let config: EmailConfig | null = null
  try {
    config = await getTenantEmailConfig(tenantId)
  } catch {
    // fall through to env fallback
  }

  const provider = config?.provider || ''
  const fromName = config?.sender_name || process.env.SMTP_FROM_NAME || 'Store'
  const fromEmail = config?.sender_email || process.env.SMTP_USER || ''
  const replyToAddr = replyTo || config?.reply_to || fromEmail

  // ── SendGrid ──────────────────────────────────────────────────────────────
  if (provider === 'sendgrid' && config?.api_key) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        reply_to: { email: replyToAddr },
        personalizations: [{ to: [{ email: to }] }],
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `SendGrid error: ${err}` }
    }
    return { success: true }
  }

  // ── Resend ────────────────────────────────────────────────────────────────
  if (provider === 'resend' && config?.api_key) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        reply_to: replyToAddr,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      return { success: false, error: `Resend error: ${err}` }
    }
    return { success: true }
  }

  // ── SMTP (nodemailer) — tenant config or env fallback ─────────────────────
  const smtpConfig = provider === 'smtp' && config?.smtp_host
    ? {
        host: config.smtp_host,
        port: parseInt(config.smtp_port || '587'),
        secure: config.smtp_secure ?? false,
        auth: { user: config.smtp_user!, pass: config.smtp_password! },
      }
    : {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
      }

  try {
    const transporter = nodemailer.createTransport(smtpConfig)
    await transporter.sendMail({
      from: `${fromName} <${fromEmail || smtpConfig.auth.user}>`,
      to,
      replyTo: replyToAddr,
      subject,
      html,
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/** Interpolate {{variable}} placeholders in a template string */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}
