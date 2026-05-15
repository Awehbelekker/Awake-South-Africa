/**
 * WhatsApp Commerce Bot — state machine
 * States: MENU → BROWSING → CART → CHECKOUT → AWAITING_PAYMENT
 *
 * Each handler receives the current session + inbound message text,
 * returns { reply, nextState, cart, context } to be saved back to DB.
 */

import { createClient } from '@supabase/supabase-js'

export type BotState = 'MENU' | 'BROWSING' | 'CART' | 'CHECKOUT' | 'AWAITING_PAYMENT'

export interface BotSession {
  id?: string
  tenant_id: string
  phone: string
  state: BotState
  cart: CartLine[]
  context: Record<string, any>
}

export interface CartLine {
  product_id: string
  name: string
  price: number
  quantity: number
}

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// ── Session helpers ───────────────────────────────────────────────────────────

export async function getSession(tenantId: string, phone: string): Promise<BotSession> {
  const { data } = await sb()
    .from('whatsapp_sessions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('phone', phone)
    .single()

  if (data) return { ...data, cart: data.cart || [], context: data.context || {} }

  return { tenant_id: tenantId, phone, state: 'MENU', cart: [], context: {} }
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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCategories(tenantId: string): Promise<string[]> {
  const { data } = await sb()
    .from('products')
    .select('category')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
  const cats = Array.from(new Set((data || []).map((p: any) => p.category).filter(Boolean)))
  return cats.slice(0, 8)
}

async function getProductsByCategory(tenantId: string, category: string): Promise<any[]> {
  const { data } = await sb()
    .from('products')
    .select('id, name, price, in_stock')
    .eq('tenant_id', tenantId)
    .eq('category', category)
    .eq('is_active', true)
    .eq('in_stock', true)
    .limit(8)
  return data || []
}

async function getTenantName(tenantId: string): Promise<string> {
  const { data } = await sb().from('tenants').select('name').eq('id', tenantId).single()
  return data?.name || 'Store'
}

function formatCart(cart: CartLine[]): string {
  if (cart.length === 0) return '_Your cart is empty_'
  const lines = cart.map((l, i) => `${i + 1}. ${l.name} ×${l.quantity} — R${(l.price * l.quantity).toLocaleString()}`)
  const total = cart.reduce((s, l) => s + l.price * l.quantity, 0)
  return lines.join('\n') + `\n\n*Total: R${total.toLocaleString()}*`
}

// ── State handlers ────────────────────────────────────────────────────────────

export async function handleMessage(session: BotSession, text: string): Promise<{ reply: string; session: BotSession }> {
  const t = text.trim().toLowerCase()

  // Global commands available in any state
  if (t === 'menu' || t === '0' || t === 'start') {
    return menuState(session)
  }
  if (t === 'cart') {
    return cartState(session)
  }

  switch (session.state) {
    case 'MENU':         return menuState(session, t)
    case 'BROWSING':     return browsingState(session, t)
    case 'CART':         return cartState(session, t)
    case 'CHECKOUT':     return checkoutState(session, t)
    case 'AWAITING_PAYMENT': return awaitingPaymentState(session, t)
    default:             return menuState(session)
  }
}

async function menuState(session: BotSession, input?: string): Promise<{ reply: string; session: BotSession }> {
  const storeName = await getTenantName(session.tenant_id)
  const categories = await getCategories(session.tenant_id)

  if (!input) {
    const menu = categories.map((c, i) => `${i + 1}. ${c}`).join('\n')
    return {
      reply: `👋 Welcome to *${storeName}*!\n\nWhat would you like to browse?\n\n${menu}\n\n_Type a number to browse, or "cart" to view your cart._`,
      session: { ...session, state: 'MENU', context: { categories } },
    }
  }

  const num = parseInt(input)
  const categories2 = session.context.categories || await getCategories(session.tenant_id)
  if (!isNaN(num) && num >= 1 && num <= categories2.length) {
    const chosen = categories2[num - 1]
    const products = await getProductsByCategory(session.tenant_id, chosen)
    const list = products.map((p: any, i: number) => `${i + 1}. ${p.name} — R${(p.price || 0).toLocaleString()}`).join('\n')
    return {
      reply: `*${chosen}*\n\n${list}\n\n_Type a number to add to cart, "back" to return to menu._`,
      session: {
        ...session,
        state: 'BROWSING',
        context: { ...session.context, categories: categories2, category: chosen, products },
      },
    }
  }

  return {
    reply: `I didn't catch that. Type a number from the menu, or "cart" to view your cart.`,
    session,
  }
}

async function browsingState(session: BotSession, input: string): Promise<{ reply: string; session: BotSession }> {
  if (input === 'back' || input === 'menu') return menuState(session)

  const products: any[] = session.context.products || []
  const num = parseInt(input)

  if (!isNaN(num) && num >= 1 && num <= products.length) {
    const product = products[num - 1]
    const existingIdx = session.cart.findIndex(l => l.product_id === product.id)
    const newCart = [...session.cart]

    if (existingIdx >= 0) {
      newCart[existingIdx] = { ...newCart[existingIdx], quantity: newCart[existingIdx].quantity + 1 }
    } else {
      newCart.push({ product_id: product.id, name: product.name, price: product.price || 0, quantity: 1 })
    }

    return {
      reply: `✅ *${product.name}* added to cart!\n\n${formatCart(newCart)}\n\n_Continue browsing or type "checkout" to pay._`,
      session: { ...session, cart: newCart },
    }
  }

  return {
    reply: `Type a product number to add it to your cart, or "back" to return to categories.`,
    session,
  }
}

async function cartState(session: BotSession, input?: string): Promise<{ reply: string; session: BotSession }> {
  if (!input) {
    return {
      reply: `🛒 *Your Cart*\n\n${formatCart(session.cart)}\n\n_Type "checkout" to pay, "clear" to empty cart, or "menu" to keep shopping._`,
      session: { ...session, state: 'CART' },
    }
  }

  if (input === 'clear') {
    return {
      reply: `Cart cleared. Type "menu" to continue shopping.`,
      session: { ...session, cart: [], state: 'MENU' },
    }
  }

  if (input === 'checkout' && session.cart.length > 0) {
    return checkoutState({ ...session, state: 'CHECKOUT' })
  }

  return cartState(session)
}

async function checkoutState(session: BotSession, input?: string): Promise<{ reply: string; session: BotSession }> {
  if (session.cart.length === 0) {
    return { reply: `Your cart is empty. Type "menu" to browse products.`, session: { ...session, state: 'MENU' } }
  }

  const total = session.cart.reduce((s, l) => s + l.price * l.quantity, 0)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awakesa.co.za'

  // Encode cart for URL (simplified — in production use a cart token from DB)
  const paymentUrl = `${siteUrl}/checkout?via=whatsapp&phone=${encodeURIComponent(session.phone)}`

  return {
    reply: `💳 *Ready to pay?*\n\n${formatCart(session.cart)}\n\nTap the link below to complete your secure payment:\n\n${paymentUrl}\n\n_Your order will be confirmed once payment is received._`,
    session: { ...session, state: 'AWAITING_PAYMENT' },
  }
}

async function awaitingPaymentState(session: BotSession, input: string): Promise<{ reply: string; session: BotSession }> {
  if (input === 'cancel' || input === 'menu') {
    return menuState({ ...session, cart: [], state: 'MENU' })
  }

  return {
    reply: `⏳ Waiting for payment confirmation. Once you've paid, your order will be processed automatically.\n\nType "cancel" to start over.`,
    session,
  }
}
