/**
 * Product Migration Script
 * 
 * Migrates products from src/lib/constants.ts to Supabase database
 */

import { createClient } from '@supabase/supabase-js'
import { PRODUCTS } from '../src/lib/constants'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required in .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  SUPABASE_SERVICE_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateProducts() {
  console.log('🚀 Starting product migration...')
  console.log(`📦 Found ${PRODUCTS.length} products to migrate\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ product: string; error: string }> = []

  for (const product of PRODUCTS) {
    try {
      const productData = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        subcategory: product.subcategory || null,
        price: product.price,
        currency: 'ZAR',
        description: product.description,
        short_description: product.shortDescription || product.description.substring(0, 200),
        features: product.features || [],
        specifications: product.specifications || {},
        images: product.images || [],
        thumbnail: product.images?.[0] || product.thumbnail || null,
        video_url: product.videoUrl || null,
        stock_quantity: product.inStock ? 10 : 0,
        is_featured: product.featured || false,
        is_published: true,
        meta_title: product.seo?.title || product.name,
        meta_description: product.seo?.description || product.description.substring(0, 160),
        keywords: product.seo?.keywords || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
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
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n📊 Migration Summary:')
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log(`   📦 Total: ${PRODUCTS.length}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    errors.forEach(({ product, error }) => {
      console.log(`   • ${product}: ${error}`)
    })
  }

  if (successCount === PRODUCTS.length) {
    console.log('\n🎉 All products migrated successfully!')
  } else if (successCount > 0) {
    console.log('\n⚠️ Partial migration completed')
  } else {
    console.log('\n❌ Migration failed')
    process.exit(1)
  }
}

migrateProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message)
    process.exit(1)
  })
