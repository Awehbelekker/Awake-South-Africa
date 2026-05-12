export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  if (cookieStore.get('master_admin_auth')) return true
  const authHeader = request.headers.get('authorization')
  const masterKey = process.env.MASTER_ADMIN_API_KEY
  return !!(masterKey && authHeader === `Bearer ${masterKey}`)
}

function normalizeUrl(url: string): string {
  url = url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url.replace(/\/$/, '')
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const patterns = [
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const href = match[1].trim()
      if (href.startsWith('http')) return href
      if (href.startsWith('//')) return 'https:' + href
      return baseUrl + (href.startsWith('/') ? '' : '/') + href
    }
  }
  return null
}

function extractLogoFromHtml(html: string, baseUrl: string): string | null {
  // Look for logo images in header/nav areas
  const patterns = [
    /<(?:header|nav)[^>]*>[\s\S]*?<img[^>]+(?:class|alt|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+(?:class|alt|id)=["'][^"']*logo[^"']*["']/i,
    /<img[^>]+(?:class|alt|id)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      const src = match[1].trim()
      if (src.startsWith('http')) return src
      if (src.startsWith('//')) return 'https:' + src
      return baseUrl + (src.startsWith('/') ? '' : '/') + src
    }
  }
  return null
}

function extractColors(html: string): { primary: string | null; theme: string | null } {
  const themeColor = extractMeta(html, 'theme-color')

  // Look for CSS custom properties in <style> tags
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)
  let primary: string | null = null

  if (styleMatch) {
    const allStyles = styleMatch.join(' ')
    const cssVarPatterns = [
      /--(?:primary|brand|main|accent)(?:-color)?:\s*(#[0-9a-f]{3,8}|rgb[^;]+)/i,
      /--color-(?:primary|brand|main):\s*(#[0-9a-f]{3,8}|rgb[^;]+)/i,
    ]
    for (const pattern of cssVarPatterns) {
      const match = allStyles.match(pattern)
      if (match?.[1]) {
        primary = match[1].trim()
        break
      }
    }
  }

  return { primary, theme: themeColor }
}

function extractJsonLdProducts(html: string): any[] {
  const products: any[] = []
  const scriptMatches = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))

  for (const match of scriptMatches) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Product') {
          products.push({
            name: item.name || '',
            description: item.description || '',
            price: item.offers?.price ? parseFloat(item.offers.price) : null,
            images: item.image ? (Array.isArray(item.image) ? item.image : [item.image]) : [],
            handle: (item.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            sku: item.sku || null,
            category: item.category || null,
          })
        }
      }
    } catch {
      // skip malformed JSON-LD
    }
  }

  return products
}

async function scrapeShopify(baseUrl: string): Promise<{ products: any[]; detected: boolean }> {
  try {
    const res = await fetch(`${baseUrl}/products.json?limit=250`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnboardBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { products: [], detected: false }

    const data = await res.json()
    if (!data.products) return { products: [], detected: false }

    const products = data.products.map((p: any) => ({
      name: p.title,
      description: p.body_html?.replace(/<[^>]+>/g, '').trim() || '',
      handle: p.handle,
      price: p.variants?.[0]?.price ? parseFloat(p.variants[0].price) : null,
      compare_at_price: p.variants?.[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : null,
      images: (p.images || []).map((img: any) => img.src),
      category: p.product_type || null,
      tags: p.tags || [],
      variants: (p.variants || []).map((v: any) => ({
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
      })),
    }))

    return { products, detected: true }
  } catch {
    return { products: [], detected: false }
  }
}

async function scrapeWooCommerce(baseUrl: string): Promise<{ products: any[]; detected: boolean }> {
  try {
    // Public WooCommerce REST API (v3 without auth returns limited public data)
    const res = await fetch(`${baseUrl}/wp-json/wc/v3/products?per_page=100&status=publish`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnboardBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { products: [], detected: false }

    const data = await res.json()
    if (!Array.isArray(data)) return { products: [], detected: false }

    const products = data.map((p: any) => ({
      name: p.name,
      description: p.short_description?.replace(/<[^>]+>/g, '').trim() || p.description?.replace(/<[^>]+>/g, '').trim() || '',
      handle: p.slug,
      price: p.price ? parseFloat(p.price) : null,
      images: (p.images || []).map((img: any) => img.src),
      category: p.categories?.[0]?.name || null,
      tags: (p.tags || []).map((t: any) => t.name),
    }))

    return { products, detected: true }
  } catch {
    return { products: [], detected: false }
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  const baseUrl = normalizeUrl(url)

  // Fetch the homepage HTML
  let html = ''
  try {
    const res = await fetch(baseUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OnboardBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    })
    html = await res.text()
  } catch (err: any) {
    return NextResponse.json({ error: `Could not reach ${baseUrl}: ${err.message}` }, { status: 422 })
  }

  // Extract brand signals from HTML
  const siteName = extractMeta(html, 'og:site_name') ||
    extractMeta(html, 'application-name') ||
    html.match(/<title>([^|<–-]+)/)?.[1]?.trim() || ''

  const ogImage = extractMeta(html, 'og:image')
  const favicon = extractFavicon(html, baseUrl)
  const logoUrl = extractLogoFromHtml(html, baseUrl) || ogImage
  const { primary, theme } = extractColors(html)
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || ''

  // Detect platform and scrape products
  let platform: 'shopify' | 'woocommerce' | 'generic' = 'generic'
  let products: any[] = []

  // Check for Shopify
  const shopify = await scrapeShopify(baseUrl)
  if (shopify.detected) {
    platform = 'shopify'
    products = shopify.products
  } else {
    // Check for WooCommerce
    const woo = await scrapeWooCommerce(baseUrl)
    if (woo.detected) {
      platform = 'woocommerce'
      products = woo.products
    } else {
      // Fall back to JSON-LD structured data on homepage
      products = extractJsonLdProducts(html)
    }
  }

  // Also check Shopify from HTML signals even if /products.json failed
  if (platform === 'generic') {
    if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme') || html.includes('myshopify.com')) {
      platform = 'shopify'
    } else if (html.includes('woocommerce') || html.includes('wp-content')) {
      platform = 'woocommerce'
    }
  }

  return NextResponse.json({
    platform,
    brand: {
      name: siteName,
      description,
      logoUrl: logoUrl || null,
      faviconUrl: favicon || null,
      primaryColor: primary || theme || null,
      themeColor: theme || null,
    },
    products,
    productCount: products.length,
    sourceUrl: baseUrl,
  })
}
