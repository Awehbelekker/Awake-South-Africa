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
  product_id?: string
}

// ── Tools available to the quote agent ────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_products',
    description: 'Search the store\'s live product catalogue by name or keyword. Returns current prices and stock status.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Product name or keyword to search for' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_product',
    description: 'Get full details for a specific product by ID, including current price, description, and variants.',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'The product UUID' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'calculate_financing',
    description: 'Calculate monthly payment for a financing plan.',
    input_schema: {
      type: 'object',
      properties: {
        total_zar: { type: 'number', description: 'Total amount in ZAR' },
        months: { type: 'number', description: 'Number of months (12, 24, or 36)' },
      },
      required: ['total_zar', 'months'],
    },
  },
  {
    name: 'generate_quote_html',
    description: 'Generate the final professional quote HTML once all pricing is confirmed. Call this last.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Final line items with accurate prices',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' },
              line_total: { type: 'number' },
            },
            required: ['name', 'quantity', 'unit_price', 'line_total'],
          },
        },
        customer_name: { type: 'string' },
        customer_email: { type: 'string' },
        customer_phone: { type: 'string' },
        subtotal: { type: 'number' },
        vat: { type: 'number' },
        total: { type: 'number' },
        financing_months: { type: 'number' },
        monthly_payment: { type: 'number' },
        notes: { type: 'string' },
        quote_number: { type: 'string' },
      },
      required: ['items', 'subtotal', 'vat', 'total'],
    },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: any, tenantId?: string): Promise<{ result: string; quoteHtml?: string; resolvedItems?: QuoteItem[] }> {
  const supabase = sb()

  if (name === 'search_products') {
    const q = input.query?.toLowerCase() || ''
    const query = supabase
      .from('products')
      .select('id, name, price, category, in_stock, description')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
      .limit(5)

    if (tenantId) query.eq('tenant_id', tenantId)

    const { data } = await query
    if (!data?.length) return { result: 'No products found.' }

    const list = data.map((p: any) =>
      `ID: ${p.id} | ${p.name} | R${(p.price || 0).toLocaleString()} | ${p.in_stock ? 'In stock' : 'Out of stock'}`
    ).join('\n')
    return { result: list }
  }

  if (name === 'get_product') {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, category, description, in_stock')
      .eq('id', input.product_id)
      .single()

    if (!data) return { result: 'Product not found.' }
    return { result: `${data.name}: R${(data.price || 0).toLocaleString()} — ${data.description || ''} (${data.in_stock ? 'In stock' : 'Out of stock'})` }
  }

  if (name === 'calculate_financing') {
    const r = 0.115 / 12 // SA prime ~8.5% + 3% annual → monthly
    const n = input.months
    const pv = input.total_zar
    const monthly = (pv * r) / (1 - Math.pow(1 + r, -n))
    return { result: `${input.months}-month plan: R${Math.round(monthly).toLocaleString()}/month (total repayable: R${Math.round(monthly * n).toLocaleString()}, rate 11.5% p.a.)` }
  }

  if (name === 'generate_quote_html') {
    const html = buildQuoteHtml(input)
    return { result: 'Quote HTML generated successfully.', quoteHtml: html }
  }

  return { result: 'Unknown tool.' }
}

// ── Agent loop ─────────────────────────────────────────────────────────────────

async function runQuoteAgent(body: any): Promise<{ quoteHtml: string; summary: any }> {
  const { items = [], customer_name, customer_email, customer_phone, financing_months, notes, tenant_id } = body

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const subtotal = items.reduce((s: number, i: QuoteItem) => s + i.price * i.quantity, 0)
  const vat = subtotal * 0.15
  const total = subtotal + vat

  const itemSummary = items.map((i: QuoteItem) =>
    `- ${i.name} ×${i.quantity} @ R${i.price.toLocaleString()} each${i.product_id ? ` (product_id: ${i.product_id})` : ''}`
  ).join('\n')

  const userMessage = `Generate a professional quote for:

Customer: ${customer_name || 'Valued Customer'}
Email: ${customer_email || 'N/A'}
Phone: ${customer_phone || 'N/A'}
Financing: ${financing_months ? `${financing_months} months` : 'None'}
Notes: ${notes || 'None'}

Requested items:
${itemSummary}

Instructions:
1. For any items with a product_id, use get_product to verify the current price from our catalogue.
2. For items without a product_id, use the price as provided.
3. If financing is requested, use calculate_financing to get the monthly amount.
4. Then call generate_quote_html with all the confirmed figures to produce the final quote.`

  const messages: any[] = [{ role: 'user', content: userMessage }]
  let quoteHtml = ''
  let summary = { subtotal, vat, total, financing_months, monthly_payment: null as number | null }

  for (let i = 0; i < 6; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a professional sales quoting agent for a premium South African water sports store. Use the available tools to verify product prices and generate accurate, professional quotes.',
        tools: TOOLS,
        messages,
      }),
    })

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`)
    const data = await res.json()

    messages.push({ role: 'assistant', content: data.content })

    const hasToolUse = data.content.some((b: any) => b.type === 'tool_use')
    if (!hasToolUse) break

    const toolResults: any[] = []
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue
      const { result, quoteHtml: html } = await executeTool(block.name, block.input, tenant_id)
      if (html) {
        quoteHtml = html
        // Extract summary from the generate_quote_html input
        summary = {
          subtotal: block.input.subtotal,
          vat: block.input.vat,
          total: block.input.total,
          financing_months: block.input.financing_months || null,
          monthly_payment: block.input.monthly_payment || null,
        }
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }
    messages.push({ role: 'user', content: toolResults })
  }

  if (!quoteHtml) {
    quoteHtml = buildQuoteHtml({
      items: items.map((i: QuoteItem) => ({ name: i.name, quantity: i.quantity, unit_price: i.price, line_total: i.price * i.quantity })),
      customer_name, customer_email, customer_phone, subtotal, vat, total,
      financing_months, notes,
      quote_number: `AWK-${Date.now()}`,
    })
  }

  return { quoteHtml, summary }
}

// ── Quote HTML builder ─────────────────────────────────────────────────────────

function buildQuoteHtml(p: any): string {
  const quoteNum = p.quote_number || `AWK-${Date.now()}`
  const rows = (p.items || []).map((i: any) =>
    `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">R${(i.unit_price || 0).toLocaleString()}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:500">R${(i.line_total || 0).toLocaleString()}</td>
    </tr>`
  ).join('')

  const annualRate = 0.115
  let financingHtml = ''
  if (p.financing_months && p.total) {
    const monthly = p.monthly_payment || Math.round((p.total * (annualRate / 12)) / (1 - Math.pow(1 + annualRate / 12, -p.financing_months)))
    financingHtml = `
    <div style="margin-top:24px;padding:16px 20px;background:#e8f4fd;border-radius:8px;border-left:4px solid #0066ff">
      <p style="margin:0 0 4px;font-weight:700;color:#0044cc">💳 Financing Option — ${p.financing_months} Months</p>
      <p style="margin:0;color:#333">Monthly payment: <strong>R${monthly.toLocaleString()}/month</strong> · Interest rate: 11.5% p.a. · Total repayable: R${(monthly * p.financing_months).toLocaleString()}</p>
    </div>`
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;background:#fff}</style></head>
<body>
<div style="max-width:720px;margin:0 auto;padding:40px 32px">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0066ff;padding-bottom:20px;margin-bottom:28px">
    <div>
      <h1 style="font-size:28px;font-weight:800;color:#0066ff;letter-spacing:-0.5px">AWAKE SOUTH AFRICA</h1>
      <p style="color:#666;font-size:13px;margin-top:4px">Premium Water Sports Equipment</p>
      <p style="color:#666;font-size:13px">info@awakesa.co.za · awakesa.co.za</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:22px;font-weight:700;color:#333">QUOTE</p>
      <p style="color:#666;font-size:13px;margin-top:4px">#${quoteNum}</p>
      <p style="color:#666;font-size:13px">${new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="color:#e55;font-size:12px;margin-top:4px">Valid for 30 days</p>
    </div>
  </div>

  <div style="margin-bottom:28px">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px">Quote Prepared For</p>
    <p style="font-size:16px;font-weight:600">${p.customer_name || 'Valued Customer'}</p>
    ${p.customer_email ? `<p style="color:#555;font-size:14px">${p.customer_email}</p>` : ''}
    ${p.customer_phone ? `<p style="color:#555;font-size:14px">${p.customer_phone}</p>` : ''}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
    <thead>
      <tr style="background:#f7f7f7">
        <th style="padding:10px 8px;text-align:left;font-size:13px;font-weight:600;color:#555;border-bottom:2px solid #e0e0e0">Description</th>
        <th style="padding:10px 8px;text-align:center;font-size:13px;font-weight:600;color:#555;border-bottom:2px solid #e0e0e0">Qty</th>
        <th style="padding:10px 8px;text-align:right;font-size:13px;font-weight:600;color:#555;border-bottom:2px solid #e0e0e0">Unit Price</th>
        <th style="padding:10px 8px;text-align:right;font-size:13px;font-weight:600;color:#555;border-bottom:2px solid #e0e0e0">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
    <table style="width:260px;font-size:14px">
      <tr>
        <td style="padding:6px 8px;color:#555">Subtotal (excl. VAT)</td>
        <td style="padding:6px 8px;text-align:right">R${(p.subtotal || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding:6px 8px;color:#555">VAT (15%)</td>
        <td style="padding:6px 8px;text-align:right">R${(p.vat || 0).toLocaleString()}</td>
      </tr>
      <tr style="border-top:2px solid #0066ff">
        <td style="padding:10px 8px;font-weight:700;font-size:16px">TOTAL</td>
        <td style="padding:10px 8px;text-align:right;font-weight:700;font-size:16px;color:#0066ff">R${(p.total || 0).toLocaleString()}</td>
      </tr>
    </table>
  </div>

  ${financingHtml}

  ${p.notes ? `<div style="margin-top:20px;padding:14px 16px;background:#fffbe6;border-radius:6px;border-left:3px solid #f5a623"><p style="font-size:13px;font-weight:600;margin-bottom:4px">Notes</p><p style="font-size:13px;color:#555">${p.notes}</p></div>` : ''}

  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee">
    <p style="font-size:12px;color:#888;line-height:1.6">
      <strong>Terms & Conditions:</strong> A 50% deposit is required to confirm the order. Balance is due prior to delivery.
      This quote is valid for 30 days from the date above. Prices include VAT. Delivery charges may apply.
      Awake South Africa reserves the right to withdraw this quote if stock becomes unavailable.
    </p>
  </div>

</div>
</body>
</html>`
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items = [], tenant_id } = body

    if (!items.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 })

    let quoteHtml: string
    let summary: any

    try {
      const result = await runQuoteAgent(body)
      quoteHtml = result.quoteHtml
      summary = result.summary
    } catch (e: any) {
      // Claude unavailable — use fallback builder directly
      const subtotal = items.reduce((s: number, i: QuoteItem) => s + i.price * i.quantity, 0)
      const vat = subtotal * 0.15
      const total = subtotal + vat
      quoteHtml = buildQuoteHtml({
        items: items.map((i: QuoteItem) => ({ name: i.name, quantity: i.quantity, unit_price: i.price, line_total: i.price * i.quantity })),
        customer_name: body.customer_name, customer_email: body.customer_email, customer_phone: body.customer_phone,
        subtotal, vat, total, financing_months: body.financing_months, notes: body.notes,
        quote_number: `AWK-${Date.now()}`,
      })
      summary = { subtotal, vat, total, financing_months: body.financing_months, monthly_payment: null }
    }

    // Save to DB
    let quoteId: string | null = null
    if (tenant_id) {
      const { data } = await sb()
        .from('quotes')
        .insert({
          tenant_id,
          customer_name: body.customer_name || null,
          customer_email: body.customer_email || null,
          customer_phone: body.customer_phone || null,
          items,
          total_zar: summary.total,
          financing_months: summary.financing_months || null,
          monthly_payment: summary.monthly_payment || null,
          quote_html: quoteHtml,
          status: 'pending',
        })
        .select('id')
        .single()
      quoteId = data?.id || null
    }

    return NextResponse.json({ success: true, quote_id: quoteId, quote_html: quoteHtml, summary })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
