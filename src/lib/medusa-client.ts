// Medusa API Client for Awake Boards SA
// Connects the Next.js storefront to Medusa e-commerce backend

import Medusa from "@medusajs/medusa-js"

// Initialize Medusa client
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
})

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
  const { products } = await medusaClient.products.list({ limit: 100 })
  return products.map((p) => convertMedusaProduct(p as unknown as MedusaProduct))
}

export async function getProductByHandle(handle: string) {
  const { products } = await medusaClient.products.list({ handle })
  return products[0] ? convertMedusaProduct(products[0] as unknown as MedusaProduct) : null
}

export async function getProductById(id: string) {
  const { product } = await medusaClient.products.retrieve(id)
  return convertMedusaProduct(product as unknown as MedusaProduct)
}

// Cart
export async function createCart() {
  const { cart } = await medusaClient.carts.create({ region_id: await getRegionId() })
  return cart
}

export async function getCart(cartId: string) {
  const { cart } = await medusaClient.carts.retrieve(cartId)
  return cart
}

export async function addToCart(cartId: string, variantId: string, quantity: number = 1) {
  const { cart } = await medusaClient.carts.lineItems.create(cartId, {
    variant_id: variantId,
    quantity,
  })
  return cart
}

export async function updateCartItem(cartId: string, lineItemId: string, quantity: number) {
  const { cart } = await medusaClient.carts.lineItems.update(cartId, lineItemId, { quantity })
  return cart
}

export async function removeFromCart(cartId: string, lineItemId: string) {
  const { cart } = await medusaClient.carts.lineItems.delete(cartId, lineItemId)
  return cart
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
  const { cart } = await medusaClient.carts.update(cartId, data)
  return cart
}

// Add shipping method to cart
export async function addShippingMethod(cartId: string, optionId: string) {
  const { cart } = await medusaClient.carts.addShippingMethod(cartId, { option_id: optionId })
  return cart
}

// Get available shipping options
export async function getShippingOptions(cartId: string) {
  const { shipping_options } = await medusaClient.shippingOptions.listCartOptions(cartId)
  return shipping_options
}

// Set payment session
export async function setPaymentSession(cartId: string, providerId: string = "manual") {
  const { cart } = await medusaClient.carts.setPaymentSession(cartId, { provider_id: providerId })
  return cart
}

// Complete cart to create order
export async function completeCart(cartId: string) {
  const response = await medusaClient.carts.complete(cartId)
  return response
}

// Get order by ID
export async function getOrder(orderId: string) {
  const { order } = await medusaClient.orders.retrieve(orderId)
  return order
}

// Get South Africa region ID
async function getRegionId() {
  const { regions } = await medusaClient.regions.list()
  const saRegion = regions.find(r => r.name === "South Africa") || regions[0]
  return saRegion?.id || ""
}

// Customer Authentication
export async function loginCustomer(email: string, password: string) {
  const { customer } = await medusaClient.auth.authenticate({ email, password })
  return customer
}

export async function registerCustomer(data: {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}) {
  const { customer } = await medusaClient.customers.create(data)
  return customer
}

export async function getCustomer() {
  const { customer } = await medusaClient.customers.retrieve()
  return customer
}

export async function logoutCustomer() {
  await medusaClient.auth.deleteSession()
}

// Get customer orders
export async function getCustomerOrders() {
  const { orders } = await medusaClient.customers.listOrders()
  return orders
}
