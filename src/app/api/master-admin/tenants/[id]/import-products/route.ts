export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies()
  if (cookieStore.get('master_admin_auth')) return true
  const authHeader = request.headers.get('authorization')
  const masterKey = process.env.MASTER_ADMIN_API_KEY
  return !!(masterKey && authHeader === `Bearer ${masterKey}`)
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: tenantId } = await params
  const { products } = await request.json()

  if (!Array.isArray(products) || products.length === 0) {
    return NextResponse.json({ error: 'No products provided' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Verify tenant exists
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const results = { imported: 0, skipped: 0, errors: 0 }

  for (const product of products) {
    try {
      const slug = product.handle || slugify(product.name)
      if (!slug || !product.name) { results.skipped++; continue }

      const productData = {
        tenant_id: tenantId,
        name: product.name,
        slug,
        description: product.description || null,
        price: product.price || 0,
        compare_at_price: product.compare_at_price || null,
        images: product.images || [],
        category: product.category || null,
        tags: product.tags || [],
        in_stock: true,
        is_active: true,
        source: 'scraped',
      }

      const { error } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'tenant_id,slug' })

      if (error) {
        results.errors++
      } else {
        results.imported++
      }

      // Small delay to avoid overwhelming the DB
      await new Promise(r => setTimeout(r, 50))
    } catch {
      results.errors++
    }
  }

  return NextResponse.json({
    success: true,
    tenantId,
    tenantName: tenant.name,
    results,
  })
}
