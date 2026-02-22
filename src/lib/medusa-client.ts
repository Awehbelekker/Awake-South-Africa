// Medusa API Client for Awake Boards SA
// Uses direct fetch calls — compatible with Medusa v2

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Store JWT token in memory (SSR-safe)
let adminToken: string | null = null

function getHeaders(isAdmin = false): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }
  if (isAdmin && adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`
  }
  return headers
}

async function fetchMedusa(path: string, options: RequestInit = {}, isAdmin = false) {
  const url = `${MEDUSA_BACKEND_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(isAdmin), ...(options.headers as Record<string, string> || {}) },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

// Legacy compat shim (keeps any code that references medusaClient compiling)
export const medusaClient = {} as never

// Type definitions for Medusa responses
export interface MedusaProduct {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  handle: string
  thumbnail: string | null
  images: { url: string }[]
  variants: MedusaVariant[]
  metadata: {
    costEUR?: number
    category?: string
    categoryTag?: string
    skillLevel?: string
    battery?: string
    badge?: string
    specs?: string[]
    features?: string[]
  }
}

export interface MedusaVariant {
  id: string
  title: string
  sku: string
  prices: { amount: number; currency_code: string }[]
  inventory_quantity: number
  metadata?: {
    costEUR?: number
    priceExVAT?: number
  }
}

export interface MedusaCart {
  id: string
  items: MedusaLineItem[]
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  region: { currency_code: string }
}

export interface MedusaLineItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  thumbnail: string | null
  variant: MedusaVariant
}

export interface MedusaCustomer {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
}

// Helper to convert Medusa product to our format
export function convertMedusaProduct(product: MedusaProduct) {
  const variant = product.variants[0]
  const price = variant?.prices?.find(p => p.currency_code === "zar") || variant?.prices?.[0]
  
  return {
    id: product.id,
    name: product.title,
    description: product.description || "",
    price: price ? price.amount / 100 : 0, // Medusa stores in cents
    priceExVAT: variant?.metadata?.priceExVAT || Math.round((price?.amount || 0) / 100 / 1.15),
    costEUR: product.metadata?.costEUR,
    image: product.thumbnail || product.images?.[0]?.url || "",
    category: product.metadata?.category || "products",
    categoryTag: product.metadata?.categoryTag || "Product",
    skillLevel: product.metadata?.skillLevel,
    battery: product.metadata?.battery,
    badge: product.metadata?.badge,
    specs: product.metadata?.specs || [],
    features: product.metadata?.features || [],
    inStock: (variant?.inventory_quantity || 0) > 0,
    stockQuantity: variant?.inventory_quantity || 0,
    handle: product.handle,
    variantId: variant?.id,
  }
}

// API Functions

// Products
export async function getProducts() {
  const data = await fetchMedusa("/store/products?limit=100")
  return (data.products || []).map((p: MedusaProduct) => convertMedusaProduct(p))
}

export async function getProductByHandle(handle: string) {
  const data = await fetchMedusa(`/store/products?handle=${handle}`)
  return data.products?.[0] ? convertMedusaProduct(data.products[0] as MedusaProduct) : null
}

export async function getProductById(id: string) {
  const data = await fetchMedusa(`/store/products/${id}`)
  return convertMedusaProduct(data.product as MedusaProduct)
}

// Cart
export async function createCart() {
  const regionId = await getRegionId()
  const data = await fetchMedusa("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: regionId }),
  })
  return data.cart
}

export async function getCart(cartId: string) {
  const data = await fetchMedusa(`/store/carts/${cartId}`)
  return data.cart
}

export async function addToCart(cartId: string, variantId: string, quantity: number = 1) {
  const data = await fetchMedusa(`/store/carts/${cartId}/line-items`, {
    method: "POST",
    body: JSON.stringify({ variant_id: variantId, quantity }),
  })
  return data.cart
}

export async function updateCartItem(cartId: string, lineItemId: string, quantity: number) {
  const data = await fetchMedusa(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  })
  return data.cart
}

export async function removeFromCart(cartId: string, lineItemId: string) {
  const data = await fetchMedusa(`/store/carts/${cartId}/line-items/${lineItemId}`, {
    method: "DELETE",
  })
  return data.cart
}

// Update cart with customer info for checkout
export async function updateCartForCheckout(cartId: string, data: {
  email: string
  billing_address?: {
    first_name: string
    last_name: string
    phone?: string
    address_1?: string
    city?: string
    province?: string
    postal_code?: string
    country_code: string
  }
  shipping_address?: {
    first_name: string
    last_name: string
    phone?: string
    address_1?: string
    city?: string
    province?: string
    postal_code?: string
    country_code: string
  }
}) {
  const res = await fetchMedusa(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(data),
  })
  return res.cart
}

// Add shipping method to cart
export async function addShippingMethod(cartId: string, optionId: string) {
  const data = await fetchMedusa(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  })
  return data.cart
}

// Get available shipping options
export async function getShippingOptions(cartId: string) {
  const data = await fetchMedusa(`/store/shipping-options/${cartId}`)
  return data.shipping_options || []
}

// Set payment session
export async function setPaymentSession(cartId: string, providerId: string = "manual") {
  const data = await fetchMedusa(`/store/carts/${cartId}/payment-sessions`, {
    method: "POST",
    body: JSON.stringify({ provider_id: providerId }),
  })
  return data.cart
}

// Complete cart to create order
export async function completeCart(cartId: string) {
  const data = await fetchMedusa(`/store/carts/${cartId}/complete`, { method: "POST" })
  return data
}

// Get order by ID
export async function getOrder(orderId: string) {
  const data = await fetchMedusa(`/store/orders/${orderId}`)
  return data.order
}

// Get South Africa region ID
async function getRegionId() {
  const data = await fetchMedusa("/store/regions")
  const saRegion = data.regions?.find((r: { name: string }) => r.name === "South Africa") || data.regions?.[0]
  return saRegion?.id || ""
}

// Customer Authentication
export async function loginCustomer(email: string, password: string) {
  const data = await fetchMedusa("/store/auth", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  return data.customer
}

export async function registerCustomer(customerData: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}) {
  const data = await fetchMedusa("/store/customers", {
    method: "POST",
    body: JSON.stringify(customerData),
  })
  return data.customer
}

export async function getCustomer() {
  const data = await fetchMedusa("/store/customers/me")
  return data.customer
}

export async function logoutCustomer() {
  await fetchMedusa("/store/auth", { method: "DELETE" })
}

// Get customer orders
export async function getCustomerOrders() {
  const data = await fetchMedusa("/store/customers/me/orders")
  return data.orders || []
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

// Admin Authentication
export async function adminLogin(email: string, password: string) {
  const data = await fetchMedusa("/admin/auth/token", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }, false)
  if (data.token) {
    adminToken = data.token
    if (typeof window !== "undefined") {
      localStorage.setItem("medusa_admin_token", data.token)
    }
  }
  return data.user
}

export async function adminLogout() {
  adminToken = null
  if (typeof window !== "undefined") {
    localStorage.removeItem("medusa_admin_token")
  }
}

export async function getAdminSession() {
  if (!adminToken && typeof window !== "undefined") {
    adminToken = localStorage.getItem("medusa_admin_token")
  }
  if (!adminToken) return null
  const data = await fetchMedusa("/admin/auth/session", {}, true)
  return data.user
}

// Admin Products
export async function adminGetProducts(limit = 100, offset = 0) {
  const data = await fetchMedusa(`/admin/products?limit=${limit}&offset=${offset}`, {}, true)
  return {
    products: (data.products || []).map((p: MedusaProduct) => convertMedusaProduct(p)),
    count: data.count || 0,
  }
}

export async function adminGetProduct(id: string) {
  const data = await fetchMedusa(`/admin/products/${id}`, {}, true)
  return convertMedusaProduct(data.product as MedusaProduct)
}

export async function adminUpdateProduct(
  id: string,
  updateData: {
    title?: string
    description?: string
    thumbnail?: string
    metadata?: Record<string, unknown>
  }
) {
  const data = await fetchMedusa(`/admin/products/${id}`, {
    method: "POST",
    body: JSON.stringify(updateData),
  }, true)
  return convertMedusaProduct(data.product as MedusaProduct)
}

export async function adminUpdateVariant(
  productId: string,
  variantId: string,
  variantData: {
    prices?: { amount: number; currency_code: string }[]
    inventory_quantity?: number
    metadata?: Record<string, unknown>
  }
) {
  const data = await fetchMedusa(`/admin/products/${productId}/variants/${variantId}`, {
    method: "POST",
    body: JSON.stringify(variantData),
  }, true)
  return convertMedusaProduct(data.product as MedusaProduct)
}

// Admin Orders
export async function adminGetOrders(limit = 100, offset = 0) {
  const data = await fetchMedusa(`/admin/orders?limit=${limit}&offset=${offset}`, {}, true)
  return { orders: data.orders || [], count: data.count || 0 }
}

export async function adminGetOrder(id: string) {
  const data = await fetchMedusa(`/admin/orders/${id}`, {}, true)
  return data.order
}

export async function adminUpdateOrder(id: string, updateData: Record<string, unknown>) {
  const data = await fetchMedusa(`/admin/orders/${id}`, {
    method: "POST",
    body: JSON.stringify(updateData),
  }, true)
  return data.order
}

// Admin Customers
export async function adminGetCustomers(limit = 100, offset = 0) {
  const data = await fetchMedusa(`/admin/customers?limit=${limit}&offset=${offset}`, {}, true)
  return { customers: data.customers || [], count: data.count || 0 }
}

export async function adminGetCustomer(id: string) {
  const data = await fetchMedusa(`/admin/customers/${id}`, {}, true)
  return data.customer
}