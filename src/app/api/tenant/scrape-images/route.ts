export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for scraping

/**
 * Product Image Scraper API
 * 
 * Scrapes product images from awakeboards.com and uploads to Supabase Storage,
 * then links the images to the matching products in the database.
 * 
 * POST /api/tenant/scrape-images
 *   body: { tenant_id, products?: string[], mode?: 'all' | 'missing' }
 * 
 * GET /api/tenant/scrape-images?tenant_id=xxx
 *   Returns status of current products and their images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ──────────────────────────────────────────────
// Product handle → awakeboards.com URL mapping
// ──────────────────────────────────────────────
const AWAKE_PRODUCT_URLS: Record<string, string> = {
  // Jetboards
  'ravik-explore': 'https://awakeboards.com/products/awake-ravik-explore',
  'ravik-adventure': 'https://awakeboards.com/products/awake-ravik-adventure',
  'ravik-ultimate': 'https://awakeboards.com/products/awake-ravik-ultimate',
  'ravik-s': 'https://awakeboards.com/products/awake-ravik-s',
  'awake-ravik-explore': 'https://awakeboards.com/products/awake-ravik-explore',
  'awake-ravik-adventure': 'https://awakeboards.com/products/awake-ravik-adventure',
  'awake-ravik-ultimate': 'https://awakeboards.com/products/awake-ravik-ultimate',
  'awake-ravik-s': 'https://awakeboards.com/products/awake-ravik-s',

  // eFoils
  'vinga-adventure': 'https://awakeboards.com/products/awake-vinga-adventure',
  'vinga-ultimate': 'https://awakeboards.com/products/awake-vinga-ultimate',
  'awake-vinga-adventure': 'https://awakeboards.com/products/awake-vinga-adventure',
  'awake-vinga-ultimate': 'https://awakeboards.com/products/awake-vinga-ultimate',

  // Limited Edition
  'brabus-shadow': 'https://awakeboards.com/products/brabus-x-awake-shadow-explore',
  'brabus-shadow-explore': 'https://awakeboards.com/products/brabus-x-awake-shadow-explore',
  'brabus-x-awake-shadow-explore': 'https://awakeboards.com/products/brabus-x-awake-shadow-explore',

  // Batteries
  'flex-battery-lr4': 'https://awakeboards.com/products/flex-battery-lr-4-90-min',
  'flex-battery-lr-4': 'https://awakeboards.com/products/flex-battery-lr-4-90-min',
  'flex-battery-xr4': 'https://awakeboards.com/products/flex-battery-xr-4-65-min',
  'flex-battery-xr-4': 'https://awakeboards.com/products/flex-battery-xr-4-65-min',
  'brabus-battery-xr4': 'https://awakeboards.com/products/brabus-battery-xr-4-45-min',
  'brabus-battery-xr-4': 'https://awakeboards.com/products/brabus-battery-xr-4-45-min',

  // Controllers
  'flex-controller': 'https://awakeboards.com/products/flex-hand-controller',
  'flex-hand-controller': 'https://awakeboards.com/products/flex-hand-controller',
  'brabus-hand-controller': 'https://awakeboards.com/products/brabus-hand-controller',

  // Wings
  'powder-1400': 'https://awakeboards.com/products/powder-1400-wing-kit',
  'powder-1400-wing-kit': 'https://awakeboards.com/products/powder-1400-wing-kit',
  'powder-1800': 'https://awakeboards.com/products/powder-1800-wing-kit',
  'powder-1800-wing-kit': 'https://awakeboards.com/products/powder-1800-wing-kit',
  'fluid-1000': 'https://awakeboards.com/products/fluid-1000-wing-kit',
  'fluid-1000-wing-kit': 'https://awakeboards.com/products/fluid-1000-wing-kit',
  'fluid-1300': 'https://awakeboards.com/products/fluid-1300-wing-kit',
  'fluid-1300-wing-kit': 'https://awakeboards.com/products/fluid-1300-wing-kit',

  // Accessories
  'board-bag-kit': 'https://awakeboards.com/products/board-bag-kit-ravik-vinga',
  'board-bag-kit-ravik-vinga': 'https://awakeboards.com/products/board-bag-kit-ravik-vinga',
  'battery-charger': 'https://awakeboards.com/products/battery-charger',
  'carbon-fins': 'https://awakeboards.com/products/carbon-fins-set-of-3',
  'carbon-fins-set-of-3': 'https://awakeboards.com/products/carbon-fins-set-of-3',
  'life-vest': 'https://awakeboards.com/products/life-vest-ce-certified',
  'life-vest-ce-certified': 'https://awakeboards.com/products/life-vest-ce-certified',
  'inflatable-dock': 'https://awakeboards.com/products/inflatable-dock',
  'jetboard-tube': 'https://awakeboards.com/products/jetboard-tube',
  'beach-mat': 'https://awakeboards.com/products/beach-mat',
  'foot-straps': 'https://awakeboards.com/products/foot-straps',
  'wall-mount': 'https://awakeboards.com/products/wall-mount',
  'impact-vest': 'https://awakeboards.com/products/impact-vest',
  'battery-backpack': 'https://awakeboards.com/products/battery-backpack',
  'competition-key': 'https://awakeboards.com/products/competition-key',
  'power-key-leash': 'https://awakeboards.com/products/power-key-leash',
  'ravik-fins': 'https://awakeboards.com/products/ravik-fins',
  'wetsuit': 'https://awakeboards.com/products/wetsuit-4-3',

  // Apparel
  't-shirt': 'https://awakeboards.com/products/awake-t-shirt',
  'cap': 'https://awakeboards.com/products/awake-cap',
  'neo-jacket': 'https://awakeboards.com/products/neo-jacket',
  'ladys-neo-suit': 'https://awakeboards.com/products/ladys-neo-suit',
}

// Slug normalization — strip common prefixes, lowercase, collapse dashes
function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/^awake-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findProductUrl(slug: string): string | null {
  // Direct match first
  if (AWAKE_PRODUCT_URLS[slug]) return AWAKE_PRODUCT_URLS[slug]

  // Normalized match
  const norm = normalizeSlug(slug)
  for (const [key, url] of Object.entries(AWAKE_PRODUCT_URLS)) {
    if (normalizeSlug(key) === norm) return url
  }

  // Fuzzy: check if slug contains any known key
  for (const [key, url] of Object.entries(AWAKE_PRODUCT_URLS)) {
    if (slug.includes(key) || key.includes(slug)) return url
  }

  return null
}

// ──────────────────────────────────────────────
// Image extraction from HTML
// ──────────────────────────────────────────────
function extractImageUrls(html: string): string[] {
  const imageUrls = new Set<string>()

  // Pattern 1: og:image meta tags (highest quality)
  const ogPattern = /property="og:image"\s+content="([^"]+)"/gi
  let match: RegExpExecArray | null
  while ((match = ogPattern.exec(html)) !== null) {
    if (match[1]) imageUrls.add(cleanImageUrl(match[1]))
  }

  // Pattern 2: Shopify CDN image URLs in src/data-src attributes
  const srcPattern = /(?:src|data-src|data-zoom|data-large|data-srcset)=["']([^"']*cdn\.shopify\.com[^"']*|[^"']*awakeboards\.com\/cdn[^"']*)/gi
  while ((match = srcPattern.exec(html)) !== null) {
    if (match[1]) {
      // Handle srcset-style (take first URL)
      const url = match[1].split(',')[0].trim().split(' ')[0]
      if (url) imageUrls.add(cleanImageUrl(url))
    }
  }

  // Pattern 3: JSON-LD structured data images
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      if (data.image) {
        const imgs = Array.isArray(data.image) ? data.image : [data.image]
        imgs.forEach((img: any) => {
          const url = typeof img === 'string' ? img : img?.url
          if (url && url.includes('awakeboards')) imageUrls.add(cleanImageUrl(url))
        })
      }
    } catch {}
  }

  // Pattern 4: Shopify product media JSON
  const mediaPattern = /"src"\s*:\s*"(https?:\/\/[^"]*awakeboards[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi
  while ((match = mediaPattern.exec(html)) !== null) {
    if (match[1]) imageUrls.add(cleanImageUrl(match[1]))
  }

  // Filter and dedupe
  return Array.from(imageUrls)
    .filter(url => {
      const lower = url.toLowerCase()
      // Must be an image
      if (!/\.(jpg|jpeg|png|webp|gif)/i.test(lower) && !lower.includes('/files/') && !lower.includes('/products/')) {
        return false
      }
      // Skip tiny icons/logos
      if (lower.includes('logo') || lower.includes('favicon') || lower.includes('icon.png') || lower.includes('32x32') || lower.includes('16x16')) {
        return false
      }
      return true
    })
    .slice(0, 15) // Max 15 images per product
}

// Clean and optimize Shopify CDN URLs
function cleanImageUrl(url: string): string {
  let cleaned = url
    .replace(/^\/\//, 'https://')
    .split('?')[0] // remove query params
    .replace(/_\d+x\d+/, '') // remove size constraints like _200x200
    .replace(/_(?:small|medium|large|grande|compact|master|original|thumb|pico|icon)/, '') // remove Shopify size suffixes
    .trim()

  // Ensure the URL is full
  if (!cleaned.startsWith('http')) {
    cleaned = `https://awakeboards.com${cleaned}`
  }

  return cleaned
}

// ──────────────────────────────────────────────
// Download + Upload pipeline
// ──────────────────────────────────────────────
async function downloadImage(url: string): Promise<{ buffer: ArrayBuffer; type: string; size: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AwakeStore/1.0)',
        'Accept': 'image/*',
      },
    })
    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    const type = response.headers.get('content-type') || 'image/jpeg'
    return { buffer, type, size: buffer.byteLength }
  } catch {
    return null
  }
}

async function uploadToSupabase(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string,
  tenantId: string,
  productSlug: string
): Promise<string | null> {
  const supabase = getSupabase()
  const timestamp = Date.now()
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
  const filePath = `${tenantId}/products/${productSlug}/${timestamp}-${cleanName}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year cache
      upsert: true,
    })

  if (error) {
    // File might exceed size limit
    if (error.message?.includes('exceeded') || error.message?.includes('size')) {
      console.warn(`File too large: ${fileName} (${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB)`)
      return null
    }
    console.error(`Upload error for ${fileName}:`, error.message)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

// ──────────────────────────────────────────────
// GET — Check image status for products
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, image, images, thumbnail')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (error) throw error

    const summary = (products || []).map((p: any) => {
      const imageCount = Array.isArray(p.images) ? p.images.length : 0
      const hasThumb = !!(p.thumbnail || p.image)
      const hasCdnOnly = hasThumb && (p.thumbnail || p.image || '').includes('awakeboards.com/cdn')
      const hasSupabase = imageCount > 0 && (p.images || []).some((img: string) => img?.includes('supabase'))
      const scrapeUrl = findProductUrl(p.slug || '')

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        imageCount,
        hasThumb,
        hasCdnOnly,
        hasSupabase,
        canScrape: !!scrapeUrl,
        needsImages: !hasSupabase || imageCount === 0,
      }
    })

    const needsScraping = summary.filter(p => p.needsImages && p.canScrape)

    return NextResponse.json({
      success: true,
      total: summary.length,
      needsScraping: needsScraping.length,
      withImages: summary.filter(p => !p.needsImages).length,
      products: summary,
    })
  } catch (error: any) {
    console.error('Scrape status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST — Run scraping for products
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantId = body.tenant_id
    const mode = body.mode || 'missing' // 'all' | 'missing' | 'selected'
    const selectedSlugs: string[] = body.products || []

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch products
    let query = supabase
      .from('products')
      .select('id, name, slug, image, images, thumbnail')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    const { data: products, error } = await query
    if (error) throw error

    // Filter products based on mode
    let toScrape = (products || []).filter((p: any) => {
      const scrapeUrl = findProductUrl(p.slug || '')
      if (!scrapeUrl) return false

      if (mode === 'selected') {
        return selectedSlugs.includes(p.slug)
      }

      if (mode === 'missing') {
        const hasSupabaseImages = Array.isArray(p.images) &&
          p.images.length > 0 &&
          p.images.some((img: string) => img?.includes('supabase'))
        return !hasSupabaseImages
      }

      return true // mode === 'all'
    })

    const results: Array<{
      slug: string
      name: string
      status: 'success' | 'failed' | 'skipped'
      imagesFound: number
      imagesUploaded: number
      error?: string
    }> = []

    // Process each product
    for (const product of toScrape) {
      const slug = product.slug || ''
      const sourceUrl = findProductUrl(slug)

      if (!sourceUrl) {
        results.push({ slug, name: product.name, status: 'skipped', imagesFound: 0, imagesUploaded: 0, error: 'No source URL' })
        continue
      }

      try {
        // Fetch product page via CORS proxy (server-side doesn't need proxy, direct fetch)
        const pageResponse = await fetch(sourceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        })

        if (!pageResponse.ok) {
          results.push({ slug, name: product.name, status: 'failed', imagesFound: 0, imagesUploaded: 0, error: `HTTP ${pageResponse.status}` })
          continue
        }

        const html = await pageResponse.text()
        const imageUrls = extractImageUrls(html)

        if (imageUrls.length === 0) {
          results.push({ slug, name: product.name, status: 'failed', imagesFound: 0, imagesUploaded: 0, error: 'No images found on page' })
          continue
        }

        // Download and upload each image
        const uploadedUrls: string[] = []

        for (const imgUrl of imageUrls) {
          const downloaded = await downloadImage(imgUrl)
          if (!downloaded || downloaded.size > 50 * 1024 * 1024) continue // Skip >50MB
          if (downloaded.size < 1024) continue // Skip <1KB (probably broken)

          const fileName = imgUrl.split('/').pop()?.split('?')[0] || 'image.jpg'
          const publicUrl = await uploadToSupabase(
            downloaded.buffer,
            fileName,
            downloaded.type,
            tenantId,
            slug
          )

          if (publicUrl) {
            uploadedUrls.push(publicUrl)
          }

          // Rate limit: 200ms between downloads
          await new Promise(r => setTimeout(r, 200))
        }

        if (uploadedUrls.length > 0) {
          // Update product in DB with new images
          const existingImages = Array.isArray(product.images) ? product.images : []
          const allImages = [...existingImages, ...uploadedUrls]

          // Use first new image as thumbnail if none exists
          const updateData: Record<string, any> = {
            images: allImages,
            updated_at: new Date().toISOString(),
          }

          // Set thumbnail to first uploaded image if current thumbnail is a CDN URL or empty
          const currentThumb = product.thumbnail || product.image
          if (!currentThumb || currentThumb.includes('awakeboards.com/cdn')) {
            updateData.thumbnail = uploadedUrls[0]
            updateData.image = uploadedUrls[0]
          }

          await supabase
            .from('products')
            .update(updateData)
            .eq('id', product.id)

          results.push({
            slug,
            name: product.name,
            status: 'success',
            imagesFound: imageUrls.length,
            imagesUploaded: uploadedUrls.length,
          })
        } else {
          results.push({
            slug,
            name: product.name,
            status: 'failed',
            imagesFound: imageUrls.length,
            imagesUploaded: 0,
            error: 'All image downloads/uploads failed',
          })
        }

        // Rate limit: 1s between products
        await new Promise(r => setTimeout(r, 1000))

      } catch (err: any) {
        results.push({
          slug,
          name: product.name,
          status: 'failed',
          imagesFound: 0,
          imagesUploaded: 0,
          error: err.message,
        })
      }
    }

    const succeeded = results.filter(r => r.status === 'success')
    const totalUploaded = succeeded.reduce((sum, r) => sum + r.imagesUploaded, 0)

    return NextResponse.json({
      success: true,
      message: `Scraped ${succeeded.length}/${toScrape.length} products, uploaded ${totalUploaded} images`,
      summary: {
        productsProcessed: toScrape.length,
        productsSucceeded: succeeded.length,
        productsFailed: results.filter(r => r.status === 'failed').length,
        productsSkipped: results.filter(r => r.status === 'skipped').length,
        totalImagesUploaded: totalUploaded,
      },
      results,
    })

  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
