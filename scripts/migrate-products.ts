/**
 * Product Migration Script
 * 
 * Migrates products from localStorage backup to Supabase database
 * 
 * Usage:
 * 1. Export products using: scripts/export-products-from-browser.html
 * 2. Set up Supabase: npx tsx scripts/setup-supabase.ts
 * 3. Run this script: npx tsx scripts/migrate-products.ts [backup-file.json]
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_KEY=... (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  console.error('\nRun: npx tsx scripts/setup-supabase.ts')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Load products from backup file
function loadProducts(): any[] {
  const args = process.argv.slice(2)
  let productsFile = args[0]
  
  // If no file specified, try to find the latest backup
  if (!productsFile) {
    const files = fs.readdirSync(process.cwd())
      .filter(f => f.startsWith('awake-products-backup-') && f.endsWith('.json'))
      .sort()
      .reverse()
    
    if (files.length > 0) {
      productsFile = files[0]
      console.log(`📦 Using latest backup: ${productsFile}`)
    } else {
      console.error('❌ No product backup file found!')
      console.error('\n📋 Steps:')
      console.error('1. Open: scripts/export-products-from-browser.html in browser')
      console.error('2. Export your products')
      console.error('3. Run this script again')
      process.exit(1)
    }
  }
  
  const filePath = path.resolve(process.cwd(), productsFile)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    process.exit(1)
  }
  
  const data = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(data)
}

async function migrateProducts() {
  console.log('🚀 Starting product migration to Supabase...\n')
  
  const products = loadProducts()
  console.log(`📦 Found ${products.length} products to migrate\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ product: string; error: string }> = []

  for (const product of products) {
    try {
      // Map localStorage product structure to Supabase schema
      const productData = {
        slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
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
        images: product.images ? product.images.map((img: any) => 
          typeof img === 'string' ? img : img.url
        ) : [product.image],
        thumbnail: product.image || product.images?.[0]?.url || product.images?.[0],
        specifications: product.specs || [],
        features: product.features || [],
        tags: [
          product.badge,
          product.skillLevel,
          product.battery,
          product.categoryTag
        ].filter(Boolean),
        is_featured: !!product.badge,
        is_new: product.badge === 'NEW',
        meta_title: product.name,
        meta_description: product.description?.substring(0, 160) || '',
      }

      const { data, error } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'slug' })
        .select()

      if (error) {
        console.error(`   ❌ ${product.name}: ${error.message}`)
        errors.push({ product: product.name, error: error.message })
        errorCount++
      } else {
        console.log(`   ✅ ${product.name}`)
        successCount++
      }
    } catch (err: any) {
      console.error(`   ❌ ${product.name}: ${err.message}`)
      errors.push({ product: product.name, error: err.message })
      errorCount++
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📦 Total: ${products.length}`)

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(({ product, error }) => {
      console.log(`   - ${product}: ${error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))

  if (successCount === products.length) {
    console.log('🎉 All products migrated successfully to Supabase!')
    console.log('\n✅ NEXT STEPS:')
    console.log('1. Verify products in Supabase dashboard')
    console.log(`2. Visit: ${supabaseUrl.replace('https://', 'https://app.')}/project/_/editor`)
    console.log('3. Check the "products" table')
    console.log('4. Your app will now use Supabase for products!')
  } else if (successCount > 0) {
    console.log('⚠️ Partial migration completed')
    console.log('Review errors above and try again for failed products')
  } else {
    console.log('❌ Migration failed')
    console.log('Check your Supabase credentials and database schema')
    process.exit(1)
  }
}

migrateProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message)
    process.exit(1)
  })
