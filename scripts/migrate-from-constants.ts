/**
 * Emergency Migration - Use products from constants file
 * 
 * If localStorage export isn't working, this will migrate products
 * from the constants file to Supabase as a starting point
 * 
 * Usage: npx tsx scripts/migrate-from-constants.ts
 */

import { createClient } from '@supabase/supabase-js'
import { PRODUCTS } from '../src/lib/constants'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Flatten all products
const allProducts = [
  ...PRODUCTS.jetboards,
  ...PRODUCTS.limitedEdition,
  ...PRODUCTS.efoils,
  ...PRODUCTS.batteries,
  ...PRODUCTS.boardsOnly,
  ...PRODUCTS.wings,
  ...PRODUCTS.bags,
  ...PRODUCTS.safetyStorage,
  ...PRODUCTS.electronics,
  ...PRODUCTS.parts,
  ...PRODUCTS.apparel,
]

async function migrate() {
  console.log('🚀 Emergency Migration: Constants → Supabase\n')
  console.log(`📦 Found ${allProducts.length} products in constants\n`)
  
  // Get or create Awake tenant
  let { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'awake')
    .single()
  
  if (tenantError || !tenant) {
    console.log('📝 Creating Awake tenant...')
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        slug: 'awake',
        name: 'Awake Store',
        domain: 'awakestore.co.za',
        is_active: true
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create tenant:', createError)
      process.exit(1)
    }
    tenant = newTenant
    console.log('✅ Tenant created\n')
  }
  
  const tenantId = tenant.id
  let successCount = 0
  let errorCount = 0
  
  for (const product of allProducts) {
    try {
      const productData = {
        tenant_id: tenantId,
        slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: product.name,
        description: product.description || '',
        long_description: product.description || '',
        price: parseFloat(product.price.toString()),
        original_price: product.priceExVAT ? parseFloat(product.priceExVAT.toString()) * 1.15 : null,
        currency: 'ZAR',
        category: product.category || 'products',
        subcategory: product.categoryTag || null,
        in_stock: true,
        stock_quantity: 5,
        sku: product.id,
        images: product.images ? 
          product.images.map((img: any) => typeof img === 'string' ? img : img.url) :
          (product.image ? [product.image] : []),
        thumbnail: product.image || product.images?.[0]?.url || product.images?.[0] || '',
        specifications: product.specs || [],
        features: product.features || [],
        tags: [product.badge, product.skillLevel, product.battery].filter(Boolean),
        is_featured: !!product.badge,
        battery_info: product.battery || null,
        skill_level: product.skillLevel || null,
        whats_included: product.whatsIncluded || [],
      }
      
      const { error } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'sku,tenant_id' })
      
      if (error) {
        console.error(`❌ ${product.name}: ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ ${product.name}`)
        successCount++
      }
    } catch (err: any) {
      console.error(`❌ ${product.name}: ${err.message}`)
      errorCount++
    }
  }
  
  console.log(`\n🎉 Migration Complete!`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${allProducts.length}`)
  
  if (successCount > 0) {
    console.log(`\n✨ Products are now in Supabase database!`)
  }
}

migrate().catch(console.error)
