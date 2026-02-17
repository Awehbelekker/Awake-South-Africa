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

  return tenant?.id || null
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Set RLS context
    await getSupabase()ase().rpc('set_config', { 
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

    if (error) throw error

    return NextResponse.json({ products })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

