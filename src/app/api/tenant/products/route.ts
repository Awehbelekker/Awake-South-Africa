export const dynamic = 'force-dynamic'

/**
 * Tenant Products API
 * 
 * GET /api/tenant/products - Get products for current tenant
 * POST /api/tenant/products - Create product (admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(): any {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getTenantId(request: NextRequest): Promise<string | null> {
  const tenantSlug = request.headers.get('x-tenant-slug')
  const customDomain = request.headers.get('x-custom-domain')
  const isCustomDomain = request.headers.get('x-is-custom-domain') === 'true'
  // Allow explicit tenant_id as query param for admin operations
  const explicitTenantId = new URL(request.url).searchParams.get('tenant_id')

  if (explicitTenantId) return explicitTenantId

  let tenant = null

  if (isCustomDomain && customDomain) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('domain', customDomain)
      .eq('is_active', true)
      .single()
    tenant = data
  } else if (tenantSlug) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .or(`subdomain.eq.${tenantSlug},slug.eq.${tenantSlug}`)
      .eq('is_active', true)
      .single()
    tenant = data
  }

  // Fallback to default Awake SA tenant
  if (!tenant) {
    const { data } = await getSupabase()
      .from('tenants')
      .select('id')
      .eq('slug', 'awake-sa')
      .single()
    tenant = data
  }

  return tenant?.id || null
}

export async function GET(request: NextRequest) {
  try {
    // Verify env vars are present
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars')
      return NextResponse.json({ error: 'Server misconfiguration: missing Supabase env vars' }, { status: 500 })
    }

    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Set RLS context
    await getSupabase().rpc('set_config', { 
      setting: 'app.tenant_id', 
      value: tenantId 
    }).catch(() => {})

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')

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

    const { data: products, error } = await query

    if (error) {
      console.error('Products query error:', JSON.stringify(error))
      throw error
    }

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

    const rows = products.map((p: any) => ({
      tenant_id: tenantId,
      name: p.name,
      slug: p.id || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: p.description || '',
      price: p.price || 0,
      price_ex_vat: p.priceExVAT || Math.round((p.price || 0) / 1.15),
      cost_eur: p.costEUR || null,
      category: p.categoryTag || p.category || 'uncategorised',
      category_tag: p.categoryTag || null,
      image: p.image || null,
      images: p.images || [],
      badge: p.badge || null,
      battery: p.battery || null,
      skill_level: p.skillLevel || null,
      specs: p.specs || [],
      features: p.features || [],
      in_stock: p.inStock ?? true,
      stock_quantity: p.stockQuantity || 0,
      is_active: true,
      is_featured: false,
      metadata: {
        localId: p.id,
      },
    }))

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

