export const dynamic = 'force-dynamic'

/**
 * Tenant Products API
 * 
 * GET /api/tenant/products - Get products for current tenant
 * POST /api/tenant/products - Create product (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getTenantIdFromRequest } from '@/lib/tenant-api'
import { getProductInventory } from '@/lib/inventory'
import { resolveCostEur, resolvePrices } from '@/lib/product-costs'

function getSupabase() {
  return getSupabaseAdmin()
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  return getTenantIdFromRequest(request)
}

function normalizeImages(images: unknown): string[] {
  if (!Array.isArray(images)) return []
  return images
    .map((img) => (typeof img === 'string' ? img : (img as { url?: string })?.url))
    .filter((url): url is string => Boolean(url))
}

function toProductRow(tenantId: string, p: Record<string, any>) {
  const slug = p.id || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const inv = getProductInventory(slug)
  const official = resolvePrices(slug)
  const costEur = resolveCostEur(slug) ?? (p.costEUR ? Number(p.costEUR) : null)
  const price = official?.retailIncVatZar ?? (Number(p.price) || 0)
  const priceExVat = official?.retailExVatZar ?? (Number(p.priceExVAT) || Math.round(price / 1.15))

  return {
    tenant_id: tenantId,
    name: p.name,
    slug,
    sku: p.id || slug,
    description: p.description || '',
    price,
    price_ex_vat: priceExVat,
    cost_eur: costEur,
    category: p.categoryTag || p.category || 'uncategorised',
    category_tag: p.categoryTag || null,
    image: p.image || null,
    images: normalizeImages(p.images),
    badge: p.badge ?? inv.badge ?? null,
    battery: p.battery || null,
    skill_level: p.skillLevel || null,
    specs: p.specs || [],
    features: p.features || [],
    what_is_included: p.whatsIncluded || [],
    in_stock: p.inStock ?? inv.inStock,
    stock_quantity: p.stockQuantity != null ? Number(p.stockQuantity) : inv.stockQuantity,
    is_active: true,
    is_featured: Boolean(p.badge || inv.badge),
    metadata: {
      localId: p.id,
      fulfillment: inv.fulfillment,
      leadTimeWeeks: inv.leadTimeWeeks,
      demoUnits: inv.demoUnits,
      landedExVatZar: official?.landedExVatZar,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify env vars are present
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json({
        error: 'Server misconfiguration: missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
        products: []
      }, { status: 500 })
    }

    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Set RLS context (optional — ignore if set_config RPC doesn't exist)
    try {
      await getSupabase().rpc('set_config', {
        setting: 'app.tenant_id',
        value: tenantId
      })
    } catch {
      // RPC not available — tenant filtering is done via .eq('tenant_id', ...) below
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '200')

    let query = getSupabase()
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data: rawProducts, error } = await query

    if (error) {
      console.error('Products query error:', JSON.stringify(error))
      throw error
    }

    // Deduplicate by slug (guards against double-upsert edge cases)
    const seen = new Set<string>()
    const products = (rawProducts || []).filter((p: any) => {
      const key = p.slug || p.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('Products GET error:', error?.message, error?.code, error?.hint)
    return NextResponse.json({ error: error.message, code: error.code, hint: error.hint }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // TODO: Add admin authentication check here
    const body = await request.json()

    const productData = {
      tenant_id: tenantId,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description,
      price: body.price,
      compare_at_price: body.compareAtPrice,
      category: body.category,
      images: body.images || [],
      variants: body.variants || [],
      inventory_quantity: body.inventoryQuantity || 0,
      is_active: body.isActive ?? true,
      is_featured: body.isFeatured ?? false,
      metadata: body.metadata || {},
    }

    const { data: product, error } = await getSupabase()
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/tenant/products - Bulk upsert products from localStorage
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const { products } = body

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    const rows = products.map((p: any) => toProductRow(tenantId, p))

    const { data, error } = await getSupabase()
      .from('products')
      .upsert(rows, { onConflict: 'tenant_id,slug', ignoreDuplicates: false })
      .select('id, name')

    if (error) {
      console.error('Products upsert error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message, code: error.code, hint: error.hint, details: error.details }, { status: 500 })
    }

    return NextResponse.json({ success: true, synced: data?.length || rows.length })
  } catch (error: any) {
    console.error('Products PUT error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/tenant/products?id=xxx  OR  body: { ids: [...] }
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Support ?id= query param for single delete
    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get('id')

    const body = await request.json().catch(() => ({}))

    // Purge all: hard-delete every product for this tenant (admin cleanup)
    if (body.purgeAll === true) {
      const { error } = await getSupabase()
        .from('products')
        .delete()
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Products purge error:', JSON.stringify(error))
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, purged: true })
    }

    let ids: string[] = []

    if (singleId) {
      ids = [singleId]
    } else {
      ids = body.ids || []
    }

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No product ids provided' }, { status: 400 })
    }

    // Soft-delete: set is_active = false
    const { data, error } = await getSupabase()
      .from('products')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .in('id', ids)
      .select('id')

    if (error) {
      console.error('Products delete error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: data?.length || ids.length })
  } catch (error: any) {
    console.error('Products DELETE error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH /api/tenant/products - Update single product or bulk update
export async function PATCH(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()

    // Bulk update: { bulk: true, ids: [...], updates: { inStock?, ... } }
    if (body.bulk === true && Array.isArray(body.ids) && body.ids.length > 0) {
      const baseRow = buildPatchRow(body.updates || {})
      if (Object.keys(baseRow).length === 0) {
        return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
      }

      let updated = 0
      for (const productId of body.ids) {
        const row = { ...baseRow }
        if (row.metadata) {
          const { data: existing } = await getSupabase()
            .from('products')
            .select('metadata')
            .eq('id', productId)
            .eq('tenant_id', tenantId)
            .single()
          row.metadata = { ...(existing?.metadata || {}), ...row.metadata }
        }
        const { error } = await getSupabase()
          .from('products')
          .update(row)
          .eq('id', productId)
          .eq('tenant_id', tenantId)
        if (!error) updated++
      }

      return NextResponse.json({ success: true, updated })
    }

    const { id, ...p } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const row = buildPatchRow(p)
    if (Object.keys(row).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    if (row.metadata) {
      const { data: existing } = await getSupabase()
        .from('products')
        .select('metadata')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single()
      row.metadata = { ...(existing?.metadata || {}), ...row.metadata }
    }

    const { data, error } = await getSupabase()
      .from('products')
      .update(row)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id')
      .single()

    if (error) {
      console.error('Products PATCH error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error: any) {
    console.error('Products PATCH error:', error?.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function buildPatchRow(p: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {}
  if (p.name !== undefined) row.name = p.name
  if (p.description !== undefined) row.description = p.description || ''
  if (p.price !== undefined) row.price = p.price
  if (p.priceExVAT !== undefined) row.price_ex_vat = p.priceExVAT
  if (p.costEUR !== undefined) row.cost_eur = p.costEUR
  if (p.category !== undefined) row.category = p.categoryTag || p.category
  if (p.categoryTag !== undefined) {
    row.category_tag = p.categoryTag
    row.category = p.categoryTag
  }
  if (p.image !== undefined) row.image = p.image
  if (p.images !== undefined) row.images = normalizeImages(p.images)
  if (p.inStock !== undefined) row.in_stock = p.inStock
  if (p.stockQuantity !== undefined) row.stock_quantity = p.stockQuantity
  if (p.fulfillment !== undefined || p.leadTimeWeeks !== undefined || p.demoUnits !== undefined) {
    row.metadata = {
      ...(p.fulfillment !== undefined && { fulfillment: p.fulfillment }),
      ...(p.leadTimeWeeks !== undefined && { leadTimeWeeks: p.leadTimeWeeks }),
      ...(p.demoUnits !== undefined && { demoUnits: p.demoUnits }),
    }
  }
  return row
}

