/**
 * Migrate products from localStorage backup to Medusa backend
 * 
 * Usage:
 * 1. Export products using: scripts/export-products-from-browser.html
 * 2. Set up Medusa admin credentials in .env.local
 * 3. Run: npx tsx scripts/migrate-local-to-medusa.ts [backup-file.json]
 * 
 * NOTE: This script is deprecated and may not work with current Medusa setup
 */

// @ts-nocheck - Legacy migration script, not actively maintained
import { medusaClient } from '../src/lib/medusa-client'
import * as fs from 'fs'
import * as path from 'path'

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://awake-south-africa-production.up.railway.app'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD

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
  console.log('🚀 Starting migration from localStorage to Medusa...\n')

  const LOCAL_PRODUCTS = loadProducts()
  console.log(`📦 Found ${LOCAL_PRODUCTS.length} products to migrate\n`)

  // Step 1: Authenticate as admin
  console.log('🔐 Authenticating as admin...')
  
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('\n❌ Missing admin credentials!')
    console.error('Add to .env.local:')
    console.error('  MEDUSA_ADMIN_EMAIL=your-email@example.com')
    console.error('  MEDUSA_ADMIN_PASSWORD=your-password')
    process.exit(1)
  }

  try {
    const authResponse = await medusaClient.admin.auth.getToken({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })
    
    console.log('✅ Authenticated successfully\n')
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message)
    console.error('\n💡 Make sure you have created an admin user in Medusa first')
    console.error('Visit: ' + MEDUSA_BACKEND_URL + '/app')
    process.exit(1)
  }

  // Step 2: Get or create South Africa region
  console.log('🌍 Setting up South Africa region...')
  const { regions } = await medusaClient.regions.list()
  let saRegion = regions.find(r => r.name === 'South Africa' || r.currency_code === 'zar')
  
  if (!saRegion) {
    console.log('Creating South Africa region...')
    const { region } = await medusaClient.admin.regions.create({
      name: 'South Africa',
      currency_code: 'zar',
      tax_rate: 15, // 15% VAT
      payment_providers: ['manual'],
      fulfillment_providers: ['manual'],
      countries: ['za'],
    })
    saRegion = region
    console.log('✅ Region created\n')
  } else {
    console.log('✅ Region found\n')
  }

  // Step 3: Migrate products
  let successCount = 0
  let errorCount = 0
  const errors: Array<{ product: string; error: string }> = []

  for (const localProduct of LOCAL_PRODUCTS) {
    try {
      console.log(`📦 Migrating: ${localProduct.name}...`)
      
      // Create product in Medusa
      const { product } = await medusaClient.admin.products.create({
        title: localProduct.name,
        description: localProduct.description || '',
        is_giftcard: false,
        discountable: true,
        handle: localProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: 'published',
        thumbnail: localProduct.image || localProduct.images?.[0]?.url,
        images: localProduct.images?.map((img: any) => 
          typeof img === 'string' ? img : img.url
        ).filter(Boolean),
        metadata: {
          originalId: localProduct.id,
          category: localProduct.category,
          categoryTag: localProduct.categoryTag,
          specs: localProduct.specs || [],
          features: localProduct.features || [],
          skillLevel: localProduct.skillLevel,
          battery: localProduct.battery,
          badge: localProduct.badge,
        },
        variants: [{
          title: 'Standard',
          sku: localProduct.id,
          prices: [{
            amount: Math.round(localProduct.price * 100), // Convert ZAR to cents
            currency_code: 'zar',
            region_id: saRegion.id,
          }],
          inventory_quantity: localProduct.stockQuantity || 5,
          manage_inventory: true,
          allow_backorder: false,
          metadata: {
            costEUR: localProduct.costEUR,
            priceExVAT: localProduct.priceExVAT,
          },
        }],
      })

      console.log(`   ✅ ${localProduct.name}`)
      successCount++
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error: any) {
      console.error(`   ❌ ${localProduct.name}: ${error.message}`)
      errors.push({ 
        product: localProduct.name, 
        error: error.response?.data?.message || error.message 
      })
      errorCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 MIGRATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📦 Total: ${LOCAL_PRODUCTS.length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(({ product, error }) => {
      console.log(`   - ${product}: ${error}`)
    })
  }
  
  console.log('\n='.repeat(60))
  
  if (successCount === LOCAL_PRODUCTS.length) {
    console.log('🎉 All products migrated successfully!')
    console.log('\n✅ NEXT STEPS:')
    console.log('1. Visit admin dashboard: ' + MEDUSA_BACKEND_URL + '/app')
    console.log('2. Verify all products are there')
    console.log('3. Check product images loaded correctly')
    console.log('4. Test the storefront')
  } else {
    console.log('⚠️ Some products failed to migrate. Review errors above.')
  }
}

// Run migration
migrateProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n💥 Fatal error:', err.message)
    console.error(err.stack)
    process.exit(1)
  })
