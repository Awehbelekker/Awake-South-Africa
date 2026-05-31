/**
 * WhatsApp Commerce Bot — Claude agent with tool use
 *
 * Claude handles natural conversation and uses tools to interact with live
 * product data, cart, and checkout. Falls back to rule-based state machine
 * if the Anthropic API is unavailable.
 */

import { createClient } from '@supabase/supabase-js'

export type BotState = 'ACTIVE' | 'AWAITING_PAYMENT' | 'MENU' | 'BROWSING' | 'CART' | 'CHECKOUT'

export interface CartLine {
  product_id: string
  name: string
  price: number
  quantity: number
}

export interface BotSession {
  id?: string
  tenant_id: string
  phone: string
  state: BotState
  cart: CartLine[]
  context: Record<string, any>
}

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// ── Session helpers ────────────────────────────────────────────────────────────

export async function getSession(tenantId: string, phone: string): Promise<BotSession> {
  const { data } = await sb()
    .from('whatsapp_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .single()
  if (data) return { ...data, cart: data.cart || [], context: data.context || {} }
  return { tenant_id: tenantId, phone, state: 'ACTIVE', cart: [], context: {} }
}

export async function saveSession(session: BotSession): Promise<void> {
  await sb()
    .from('whatsapp_sessions')
    .upsert({
      tenant_id: session.tenant_id,
      phone: session.phone,
      state: session.state,
      cart: session.cart,
      context: session.context,
      last_activity: new Date().toISOString(),
    }, { onConflict: 'tenant_id,phone' })
}

// ── Tool definitions ───────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_products',
    description: 'Search for products by name or category. Returns a list of matching in-stock products with prices.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term — product name, category, or keyword' },
      },
      required: ['query'],
    },
  },
  {
    name: 'view_cart',
    description: 'Show the customer\'s current cart contents and total.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'add_to_cart',
    description: 'Add a product to the customer\'s cart.',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'The product ID to add' },
        product_name: { type: 'string', description: 'Product name (for confirmation message)' },
        price: { type: 'number', description: 'Product price in ZAR' },
        quantity: { type: 'number', description: 'Quantity to add (default 1)' },
      },
      required: ['product_id', 'product_name', 'price'],
    },
  },
  {
    name: 'remove_from_cart',
    description: 'Remove a product from the cart by product name.',
    input_schema: {
      type: 'object',
      properties: {
        product_name: { type: 'string', description: 'Name of the product to remove' },
      },
      required: ['product_name'],
    },
  },
  {
    name: 'get_payment_link',
    description: 'Generate a secure PayFast checkout link for the current cart. Use this when the customer is ready to pay.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_order_status',
    description: 'Look up the status of a recent order for this customer.',
    input_schema: { type: 'object', properties: {} },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: any, session: BotSession): Promise<{ result: string; updatedCart?: CartLine[] }> {
  const supabase = sb()

  if (name === 'search_products') {
    const query = input.query?.toLowerCase() || ''
    const { data } = await supabase
      .from('products')
      .select('id, name, price, category, description, in_stock')
      .eq('tenant_id', session.tenant_id)
      .eq('is_active', true)
      .eq('in_stock', true)
      .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(6)

    if (!data?.length) return { result: 'No products found matching that search.' }

    const list = data.map((p: any) =>
      `• *${p.name}* — R${(p.price || 0).toLocaleString()} [ID: ${p.id}]`
    ).join('\n')
    return { result: `Found ${data.length} product(s):\n${list}` }
  }

  if (name === 'view_cart') {
    if (!session.cart.length) return { result: 'Cart is empty.' }
    const lines = session.cart.map(l =>
      `• ${l.name} ×${l.quantity} = R${(l.price * l.quantity).toLocaleString()}`
    ).join('\n')
    const total = session.cart.reduce((s, l) => s + l.price * l.quantity, 0)
    return { result: `${lines}\n\n*Total: R${total.toLocaleString()}*` }
  }

  if (name === 'add_to_cart') {
    const qty = Math.max(1, input.quantity || 1)
    const existing = session.cart.findIndex(l => l.product_id === input.product_id)
    const newCart = [...session.cart]
    if (existing >= 0) {
      newCart[existing] = { ...newCart[existing], quantity: newCart[existing].quantity + qty }
    } else {
      newCart.push({ product_id: input.product_id, name: input.product_name, price: input.price, quantity: qty })
    }
    const total = newCart.reduce((s, l) => s + l.price * l.quantity, 0)
    return {
      result: `✅ Added ${input.product_name} ×${qty} to cart. Cart total: R${total.toLocaleString()}.`,
      updatedCart: newCart,
    }
  }

  if (name === 'remove_from_cart') {
    const newCart = session.cart.filter(l => !l.name.toLowerCase().includes(input.product_name.toLowerCase()))
    const removed = session.cart.length - newCart.length
    return {
      result: removed > 0 ? `Removed ${input.product_name} from cart.` : `Product not found in cart.`,
      updatedCart: newCart,
    }
  }

  if (name === 'get_payment_link') {
    if (!session.cart.length) return { result: 'Cart is empty — add products first.' }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awakesa.co.za'
    const link = `${siteUrl}/checkout?via=whatsapp&phone=${encodeURIComponent(session.phone)}`
    const total = session.cart.reduce((s, l) => s + l.price * l.quantity, 0)
    return { result: `Payment link (R${total.toLocaleString()} total):\n${link}\n\nThis link opens secure PayFast checkout. Your order is confirmed once payment is received.` }
  }

  if (name === 'get_order_status') {
    const { data } = await supabase
      .from('orders')
      .select('order_number, status, total, created_at')
      .eq('tenant_id', session.tenant_id)
      .eq('customer_phone', session.phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return { result: 'No recent orders found for your number.' }
    return {
      result: `Order *${data.order_number}*: ${data.status.toUpperCase()} — R${(data.total || 0).toLocaleString()} (${new Date(data.created_at).toLocaleDateString('en-ZA')})`,
    }
  }

  return { result: 'Unknown tool.' }
}

// ── Claude agent loop ──────────────────────────────────────────────────────────

async function runAgentLoop(session: BotSession, userMessage: string): Promise<{ reply: string; session: BotSession }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackHandler(session, userMessage)

  const { data: tenant } = await sb().from('tenants').select('name').eq('id', session.tenant_id).single()
  const storeName = tenant?.name || 'our store'

  // Build conversation history (keep last 10 turns to stay within context)
  const history: any[] = (session.context.history || []).slice(-20)
  history.push({ role: 'user', content: userMessage })

  const systemPrompt = `You are a friendly WhatsApp sales assistant for *${storeName}*, a premium water sports equipment store in South Africa.

Your job: help customers browse products, manage their cart, and complete purchases — all through WhatsApp.

Guidelines:
- Keep replies SHORT and conversational — this is WhatsApp, not email
- Use *bold* for product names and prices (WhatsApp markdown)
- Use bullet points with • for lists
- Always use South African Rand (R) for prices
- When a customer wants to see products, use search_products to find real items
- When they want to buy, use add_to_cart with the actual product ID and price
- When ready to pay, use get_payment_link
- Be enthusiastic about water sports! 🏄
- If the customer seems to be done or confused, offer to show the menu or cart`

  let messages = [...history]
  let updatedCart = [...session.cart]
  let finalReply = ''
  const MAX_ITERATIONS = 5

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Fast + cheap for WhatsApp
        max_tokens: 400,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      }),
    })

    if (!res.ok) return fallbackHandler(session, userMessage)
    const data = await res.json()

    // Add assistant response to history
    messages.push({ role: 'assistant', content: data.content })

    // Check if we're done (no tool calls)
    const hasToolUse = data.content.some((b: any) => b.type === 'tool_use')
    if (!hasToolUse) {
      finalReply = data.content.find((b: any) => b.type === 'text')?.text || ''
      break
    }

    // Execute all tool calls and collect results
    const toolResults: any[] = []
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue
      const sessionWithCart = { ...session, cart: updatedCart }
      const { result, updatedCart: newCart } = await executeTool(block.name, block.input, sessionWithCart)
      if (newCart) updatedCart = newCart
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  if (!finalReply) finalReply = "I'm here to help! Ask me about products, pricing, or type *cart* to see your basket."

  // Trim history to last 10 exchanges before saving
  const trimmedHistory = messages.slice(-20)

  return {
    reply: finalReply,
    session: {
      ...session,
      cart: updatedCart,
      state: 'ACTIVE',
      context: { ...session.context, history: trimmedHistory },
    },
  }
}

// ── Fallback state machine (used when Claude API unavailable) ──────────────────

async function fallbackHandler(session: BotSession, text: string): Promise<{ reply: string; session: BotSession }> {
  const t = text.trim().toLowerCase()
  const { data: tenant } = await sb().from('tenants').select('name').eq('id', session.tenant_id).single()
  const storeName = tenant?.name || 'Store'

  if (t === 'cart') {
    const cartText = session.cart.length
      ? session.cart.map(l => `• ${l.name} ×${l.quantity} — R${(l.price * l.quantity).toLocaleString()}`).join('\n') +
        `\n\n*Total: R${session.cart.reduce((s, l) => s + l.price * l.quantity, 0).toLocaleString()}*`
      : '_Your cart is empty_'
    return { reply: `🛒 *Cart*\n\n${cartText}\n\nType *checkout* to pay or *menu* to continue.`, session }
  }

  if (t === 'checkout' && session.cart.length) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awakesa.co.za'
    const link = `${siteUrl}/checkout?via=whatsapp&phone=${encodeURIComponent(session.phone)}`
    return { reply: `💳 Complete your payment here:\n${link}`, session: { ...session, state: 'AWAITING_PAYMENT' } }
  }

  const { data: products } = await sb()
    .from('products').select('id, name, price').eq('tenant_id', session.tenant_id)
    .eq('is_active', true).eq('in_stock', true).limit(6)

  const list = (products || []).map((p: any, i: number) =>
    `${i + 1}. ${p.name} — R${(p.price || 0).toLocaleString()}`
  ).join('\n')

  return {
    reply: `👋 Welcome to *${storeName}*!\n\nOur products:\n\n${list}\n\nReply with a number to add to cart, or *cart* to view yours.`,
    session: { ...session, state: 'ACTIVE', context: { products } },
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

export async function handleMessage(session: BotSession, text: string): Promise<{ reply: string; session: BotSession }> {
  return runAgentLoop(session, text)
}
