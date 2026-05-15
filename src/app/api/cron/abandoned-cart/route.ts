export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email-service'
import { sendCustomWhatsApp } from '@/lib/whatsapp-service'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  // Vercel cron calls with an Authorization header matching CRON_SECRET
  const auth = request.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  // Find carts inactive > 1h, not yet recovered, with contact info, recovery not sent yet
  const { data: carts, error } = await sb()
    .from('carts')
    .select('id, tenant_id, session_id, customer_email, customer_phone, items, total_zar')
    .eq('recovered', false)
    .is('recovery_sent_at', null)
    .lt('last_activity', oneHourAgo)
    .not('items', 'eq', '[]')
    .limit(50)

  if (error) {
    console.error('Abandoned cart cron error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  const results: string[] = []

  for (const cart of carts || []) {
    const hasEmail = !!cart.customer_email
    const hasPhone = !!cart.customer_phone
    if (!hasEmail && !hasPhone) continue

    // Get tenant name for personalisation
    const { data: tenant } = await sb()
      .from('tenants')
      .select('name')
      .eq('id', cart.tenant_id)
      .single()

    const storeName = tenant?.name || 'The Store'
    const items: any[] = cart.items || []
    const itemList = items.map((i: any) => `${i.name} ×${i.quantity}`).join(', ')
    const total = `R${(cart.total_zar || 0).toLocaleString()}`

    // Send WhatsApp if phone available
    if (hasPhone) {
      try {
        await sendCustomWhatsApp({
          tenantId: cart.tenant_id,
          to: cart.customer_phone,
          message: `Hey! You left items in your ${storeName} cart 🛒\n\n${itemList}\n\nTotal: ${total}\n\nComplete your order here: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://awakesa.co.za'}/cart`,
        })
        sent++
        results.push(`wa:${cart.customer_phone}`)
      } catch (e: any) {
        results.push(`wa_fail:${e.message}`)
      }
    }

    // Send email if available and no phone (avoid double-send)
    if (hasEmail && !hasPhone) {
      try {
        await sendEmail({
          tenantId: cart.tenant_id,
          to: cart.customer_email,
          subject: `You left something behind at ${storeName}`,
          html: abandonedCartHtml(storeName, items, cart.total_zar),
        })
        sent++
        results.push(`email:${cart.customer_email}`)
      } catch (e: any) {
        results.push(`email_fail:${e.message}`)
      }
    }

    // Mark recovery sent
    await sb()
      .from('carts')
      .update({ recovery_sent_at: new Date().toISOString() })
      .eq('id', cart.id)
  }

  return NextResponse.json({ processed: carts?.length || 0, sent, results })
}

function abandonedCartHtml(storeName: string, items: any[], total: number): string {
  const rows = items.map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">×${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">R${(i.price * i.quantity).toLocaleString()}</td></tr>`
  ).join('')

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#333">
      <h2 style="color:#111">You left something behind at ${storeName} 🛒</h2>
      <p>Your cart is waiting for you:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #eee">Item</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #eee">Qty</th>
          <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #eee">Price</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="2" style="padding-top:12px;font-weight:bold">Total</td>
          <td style="padding-top:12px;font-weight:bold;text-align:right">R${(total || 0).toLocaleString()}</td>
        </tr></tfoot>
      </table>
      <p style="margin-top:24px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || '#'}/cart"
           style="background:#0066ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Complete My Order
        </a>
      </p>
      <p style="color:#888;font-size:12px;margin-top:24px">
        Don't want these reminders? Just ignore this email.
      </p>
    </div>
  `
}
