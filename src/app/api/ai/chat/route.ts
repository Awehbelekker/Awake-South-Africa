/**
 * Claude AI endpoint — chat, insights, recommendations, followup
 * Ported from CogniCore, adapted for multi-tenant platform.
 * API key resolved from: request body → ANTHROPIC_API_KEY env var.
 */

export const runtime = 'edge'

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CLAUDE_MODEL = 'claude-sonnet-4-6'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

async function callClaude(apiKey: string, payload: object) {
  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: CLAUDE_MODEL, ...payload }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API ${res.status}: ${err}`)
  }
  return res.json()
}

async function handleFollowup(apiKey: string, body: Record<string, unknown>) {
  const { customer, invoice, customerHistory, business } = body as Record<string, any>
  const businessName = business?.name || 'Our Store'
  const tone = business?.tone || 'friendly and professional'

  let historyCtx = ''
  if (customerHistory) {
    historyCtx = `\nCustomer History:\n- ${customerHistory.tier || 'retail'} tier\n- ${customerHistory.invoiceCount || 0} previous orders\n- R${(customerHistory.totalSpent || 0).toLocaleString()} total spent\n- ${customerHistory.paymentRate ?? 100}% on-time payment rate`
  }

  const data = await callClaude(apiKey, {
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a payment reminder assistant for ${businessName}. Use a ${tone} tone.

Generate a personalized, warm but professional payment reminder:

Customer: ${customer?.name || 'Valued Customer'}
Invoice: ${invoice?.number || 'N/A'}
Amount Due: R${invoice?.total || 0}
Due Date: ${invoice?.dueDate || 'N/A'}
Days Overdue: ${invoice?.daysOverdue || 0}
${historyCtx}

Keep it concise (2-3 sentences). Be friendly but clear about the payment expectation. Include a call to action.`,
    }],
  })
  return { message: data.content[0].text, source: 'claude', action: 'followup' }
}

async function handleInsights(apiKey: string, body: Record<string, unknown>) {
  const { context } = body as Record<string, any>
  const data = await callClaude(apiKey, {
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Analyze this business data and provide 3-5 actionable insights:

Business Metrics:
- Total Revenue: R${context?.totalRevenue || 0}
- This Month Revenue: R${context?.monthRevenue || 0}
- Outstanding Invoices: R${context?.outstanding || 0}
- Total Customers: ${context?.customerCount || 0}
- Total Invoices: ${context?.invoiceCount || 0}
- Overdue Invoices: ${context?.overdueCount || 0}
- Top Products: ${context?.topProducts?.join(', ') || 'N/A'}
- Average Order Value: R${context?.avgOrderValue || 0}

Format as numbered list with emoji. Focus on: cash flow, customer retention, growth, risk.`,
    }],
  })
  return { insights: data.content[0].text, source: 'claude', action: 'insights' }
}

async function handleRecommendations(apiKey: string, body: Record<string, unknown>) {
  const { customer, customerHistory, context } = body as Record<string, any>
  const purchaseHistory = customerHistory?.recentPurchases?.join(', ') || 'No history'
  const products = context?.products?.slice(0, 20).map((p: { name: string }) => p.name).join(', ') || 'Various products'

  const data = await callClaude(apiKey, {
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You're a sales assistant for a water sports equipment store (Jetboards, eFoils, SUPs, accessories).

Customer: ${customer?.name || 'Customer'}
Previous Purchases: ${purchaseHistory}
Available Products: ${products}

Suggest 3 products they might want next, with brief reasons. Format:
1. **Product**: Reason (max 10 words)
2. **Product**: Reason
3. **Product**: Reason`,
    }],
  })
  return { recommendations: data.content[0].text, source: 'claude', action: 'recommendations' }
}

async function handleChat(apiKey: string, body: Record<string, unknown>) {
  const { message, context, tenantName } = body as Record<string, any>
  const ctx = context ? `\nBusiness snapshot:\n- Invoices: ${context.invoiceCount || 0}\n- Outstanding: R${context.outstanding || 0}\n- Customers: ${context.customerCount || 0}\n- Today's Revenue: R${context.todayRevenue || 0}\n- Overdue: ${context.overdueCount || 0}` : ''

  const data = await callClaude(apiKey, {
    max_tokens: 400,
    system: `You are an AI assistant for ${tenantName || 'this store'}'s admin dashboard. Help with: orders, invoices, customers, products, analytics, and business advice.${ctx}\nBe concise and action-oriented.`,
    messages: [{ role: 'user', content: message || 'Hello' }],
  })
  return { message: data.content[0].text, source: 'claude', action: 'chat' }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>
    const { action, apiKey } = body as { action?: string; apiKey?: string }

    const claudeApiKey = apiKey || process.env.ANTHROPIC_API_KEY
    if (!claudeApiKey) {
      return new Response(JSON.stringify({
        error: 'Claude API key not configured',
        message: 'Add your Anthropic API key in Settings or set ANTHROPIC_API_KEY env variable',
      }), { status: 400, headers: corsHeaders })
    }

    let result: Record<string, unknown>
    switch (action) {
      case 'followup':        result = await handleFollowup(claudeApiKey, body); break
      case 'insights':        result = await handleInsights(claudeApiKey, body); break
      case 'recommendations': result = await handleRecommendations(claudeApiKey, body); break
      case 'chat':
      default:                result = await handleChat(claudeApiKey, body); break
    }

    return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg, source: 'error' }), { status: 500, headers: corsHeaders })
  }
}
