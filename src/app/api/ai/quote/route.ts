export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface QuoteItem {
  name: string
  price: number
  quantity: number
}

// POST /api/ai/quote
// Body: { items, customer_name, customer_email, customer_phone, financing_months, notes, tenant_id }
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { items = [], customer_name, customer_email, customer_phone, financing_months, notes, tenant_id } = body

  if (!items.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 })

  const subtotal = items.reduce((s: number, i: QuoteItem) => s + i.price * i.quantity, 0)
  const saVatRate = 0.15
  const vatAmount = subtotal * saVatRate
  const total = subtotal + vatAmount

  // Financing calculation — SA prime + 3% as monthly compounding
  const annualRate = 0.115 // ~11.5% (SA prime ~8.5% + 3%)
  let monthlyPayment = 0
  if (financing_months && financing_months > 0) {
    const r = annualRate / 12
    monthlyPayment = (total * r) / (1 - Math.pow(1 + r, -financing_months))
  }

  // Build prompt for Claude
  const itemList = items.map((i: QuoteItem) =>
    `- ${i.name} ×${i.quantity}: R${(i.price * i.quantity).toLocaleString()}`
  ).join('\n')

  const prompt = `You are a professional sales consultant for a premium water sports equipment store.
Generate a formal, professional quote in clean HTML (no \`\`\`html wrapper) for:

Customer: ${customer_name || 'Valued Customer'}
Email: ${customer_email || 'N/A'}
Phone: ${customer_phone || 'N/A'}

Items:
${itemList}

Subtotal: R${subtotal.toLocaleString()}
VAT (15%): R${vatAmount.toLocaleString()}
Total: R${total.toLocaleString()}
${financing_months ? `Financing: ${financing_months} months at R${Math.round(monthlyPayment).toLocaleString()}/month` : ''}
${notes ? `Notes: ${notes}` : ''}

Generate a professional HTML quote with:
1. Company letterhead area (placeholder for logo)
2. Quote number and date
3. Customer details
4. Itemised table with quantities, unit prices, subtotal
5. VAT breakdown
6. Grand total (bold)
${financing_months ? '7. Financing option highlighted in a green info box' : ''}
8. Terms: 30 days validity, 50% deposit to confirm order
9. Professional closing

Use clean inline CSS, SA Rand (R), professional styling. No external dependencies.`

  const apiKey = process.env.ANTHROPIC_API_KEY
  let quoteHtml = ''

  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      quoteHtml = data.content?.[0]?.text || ''
    } catch (e: any) {
      console.error('Claude quote error:', e.message)
    }
  }

  // Fallback to simple HTML if Claude fails
  if (!quoteHtml) {
    quoteHtml = buildFallbackQuote({ items, customer_name, customer_email, subtotal, vatAmount, total, financing_months, monthlyPayment })
  }

  // Save quote to DB if tenant provided
  let quoteId: string | null = null
  if (tenant_id) {
    const { data } = await sb()
      .from('quotes')
      .insert({
        tenant_id,
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        items,
        total_zar: total,
        financing_months: financing_months || null,
        monthly_payment: monthlyPayment ? Math.round(monthlyPayment) : null,
        quote_html: quoteHtml,
        status: 'pending',
      })
      .select('id')
      .single()
    quoteId = data?.id || null
  }

  return NextResponse.json({
    success: true,
    quote_id: quoteId,
    quote_html: quoteHtml,
    summary: {
      subtotal,
      vat: vatAmount,
      total,
      financing_months,
      monthly_payment: monthlyPayment ? Math.round(monthlyPayment) : null,
    },
  })
}

function buildFallbackQuote({ items, customer_name, customer_email, subtotal, vatAmount, total, financing_months, monthlyPayment }: any): string {
  const rows = items.map((i: QuoteItem) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R${i.price.toLocaleString()}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R${(i.price * i.quantity).toLocaleString()}</td></tr>`
  ).join('')

  return `
<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:32px;color:#1a1a1a">
  <div style="border-bottom:3px solid #0066ff;padding-bottom:16px;margin-bottom:24px">
    <h1 style="margin:0;color:#0066ff">QUOTE</h1>
    <p style="margin:4px 0 0;color:#666">Date: ${new Date().toLocaleDateString('en-ZA')} | Valid for 30 days</p>
  </div>
  <p><strong>To:</strong> ${customer_name || 'Valued Customer'}${customer_email ? ` &lt;${customer_email}&gt;` : ''}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:20px">
    <thead><tr style="background:#f5f5f5">
      <th style="padding:10px;text-align:left">Item</th>
      <th style="padding:10px;text-align:center">Qty</th>
      <th style="padding:10px;text-align:right">Unit Price</th>
      <th style="padding:10px;text-align:right">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:8px;text-align:right">Subtotal</td><td style="padding:8px;text-align:right">R${subtotal.toLocaleString()}</td></tr>
      <tr><td colspan="3" style="padding:8px;text-align:right">VAT (15%)</td><td style="padding:8px;text-align:right">R${vatAmount.toLocaleString()}</td></tr>
      <tr style="background:#f5f5f5"><td colspan="3" style="padding:10px;text-align:right;font-weight:bold">TOTAL</td><td style="padding:10px;text-align:right;font-weight:bold;font-size:1.1em">R${total.toLocaleString()}</td></tr>
    </tfoot>
  </table>
  ${financing_months && monthlyPayment ? `<div style="margin-top:20px;padding:16px;background:#e8f4fd;border-radius:8px;border-left:4px solid #0066ff"><p style="margin:0;font-weight:bold">💳 Financing Option: ${financing_months} months</p><p style="margin:4px 0 0">Monthly payment: R${Math.round(monthlyPayment).toLocaleString()}/month (rate ~11.5% p.a.)</p></div>` : ''}
  <p style="margin-top:24px;color:#666;font-size:14px">Terms: 50% deposit required to confirm order. Balance due on delivery. Quote valid for 30 days.</p>
</div>`
}
