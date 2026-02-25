/**
 * Quick Migration - Export from localStorage AND migrate to Supabase in one go
 * 
 * This script will:
 * 1. Read products from the Zustand store backup
 * 2. Migrate them directly to Supabase
 * 
 * Usage: npx tsx scripts/quick-migrate.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Read products from localStorage backup (if available)
function getProductsFromBrowserStorage(): any[] {
  // Check if there's a recent backup file
  const files = fs.readdirSync(process.cwd())
    .filter(f => f.startsWith('awake-products-backup-') && f.endsWith('.json'))
    .sort()
    .reverse()
  
  if (files.length > 0) {
    const backupFile = files[0]
    console.log(`📦 Found backup file: ${backupFile}`)
    const data = fs.readFileSync(path.join(process.cwd(), backupFile), 'utf-8')
    return JSON.parse(data)
  }
  
  // If no backup, check if products are in node_modules/.cache or temp
  console.log('⚠️  No backup file found')
  console.log('Please export products first:')
  console.log('1. Open scripts/export-products-from-browser.html')
  console.log('2. Click "Export Products"')
  console.log('3. Run this script again')
  process.exit(1)
}

async function quickMigrate() {
  console.log('🚀 Quick Migration Starting...\n')
  
  // Load products
  const products = getProductsFromBrowserStorage()
  console.log(`✅ Loaded ${products.length} products\n`)
  
  if (products.length === 0) {
    console.log('❌ No products to migrate')
    process.exit(1)
  }
  
  // Get tenant ID (Awake)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'awake')
    .single()
  
  if (tenantError || !tenant) {
    console.error('❌ Awake tenant not found. Creating...')
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
    console.log('✅ Created Awake tenant')
  }
  
  const tenantId = tenant?.id
  
  // Migrate each product
  let successCount = 0
  let errorCount = 0
  
  for (const product of products) {
    try {
      const productData = {
        tenant_id: tenantId,
        slug: (product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: product.name,
        description: product.description || '',
        long_description: product.description || '',
        price: parseFloat(product.price || 0),
        original_price: product.priceExVAT ? parseFloat(product.priceExVAT) * 1.15 : null,
        currency: 'ZAR',
        category: product.category || 'products',
        subcategory: product.categoryTag || null,
        in_stock: product.inStock !== false,
        stock_quantity: parseInt(product.stockQuantity || 5),
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
  
  // Summary
  console.log(`\n🎉 Migration Complete!`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📊 Total: ${products.length}`)
  
  if (successCount > 0) {
    console.log(`\n✨ Your products are now in Supabase!`)
    console.log(`🔗 Visit: http://localhost:3000/products`)
  }
}

// Run migration
quickMigrate().catch(console.error)
