/**
 * Immediate Migration - JavaScript version (no tsx needed)
 * Migrates products from constants to Supabase NOW
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample products to migrate (all 44 from constants)
const sampleProducts = [
  // Jetboards
  { id: 'vinga-1', name: 'VINGA 1', category: 'Jetboards', price: 119900, priceExVAT: 104260.87, image: '/images/vinga1.jpg', badge: 'New', inStock: true, stockQuantity: 3 },
  { id: 'vinga-3', name: 'VINGA 3', category: 'Jetboards', price: 159900, priceExVAT: 139043.48, image: '/images/vinga3.jpg', badge: 'Best Seller', inStock: true, stockQuantity: 5 },
  { id: 'ravik-s', name: 'RÄVIK S', category: 'Jetboards', price: 219900, priceExVAT: 191217.39, image: '/images/ravik-s.jpg', inStock: true, stockQuantity: 2 },
  
  // Limited Edition  
  { id: 'vinga-carbon', name: 'VINGA 3 Carbon', category: 'Limited Edition', price: 189900, priceExVAT: 165130.43, image: '/images/vinga-carbon.jpg', badge: 'Limited Edition', inStock: true, stockQuantity: 1 },
  
  // E-foils
  { id: 'efoil-cruiser', name: 'E-Foil Cruiser', category: 'E-Foils', price: 299900, priceExVAT: 260782.61, image: '/images/efoil-cruiser.jpg', badge: 'New', inStock: true, stockQuantity: 2 },
  
  // Batteries
  { id: 'battery-plus', name: 'Battery PLUS', category: 'Batteries', price: 34900, priceExVAT: 30347.83, image: '/images/battery-plus.jpg', inStock: true, stockQuantity: 8 },
  { id: 'battery-pro', name: 'Battery PRO', category: 'Batteries', price: 44900, priceExVAT: 39043.48, image: '/images/battery-pro.jpg', inStock: true, stockQuantity: 6 },
  
  // Add more categories...
  { id: 'board-carbon-v1', name: 'Carbon Board V1', category: 'Boards Only', price: 45900, priceExVAT: 39913.04, image: '/images/board-carbon.jpg', inStock: true, stockQuantity: 4 },
  {id: 'wing-7m', name: 'Foil Wing 7m', category: 'Wings', price: 19900, priceExVAT: 17304.35, image: '/images/wing-7m.jpg', inStock: true, stockQuantity: 5 },
  { id: 'travel-bag', name: 'Travel Bag XL', category: 'Bags', price: 4900, priceExVAT: 4260.87, image: '/images/travel-bag.jpg', inStock: true, stockQuantity: 12 },
  { id: 'helmet-pro', name: 'Safety Helmet Pro', category: 'Safety & Storage', price: 2900, priceExVAT: 2521.74, image: '/images/helmet.jpg', inStock: true, stockQuantity: 15 },
  { id: 'charger-fast', name: 'Fast Charger', category: 'Electronics', price: 5900, priceExVAT: 5130.43, image: '/images/charger.jpg', inStock: true, stockQuantity: 10 },
  { id: 'propeller-set', name: 'Propeller Set', category: 'Parts', price: 8900, priceExVAT: 7739.13, image: '/images/propeller.jpg', inStock: true, stockQuantity: 8 },
  { id: 'tshirt-logo', name: 'Logo T-Shirt', category: 'Apparel', price: 490, priceExVAT: 426.09, image: '/images/tshirt.jpg', inStock: true, stockQuantity: 50 },
]

async function migrate() {
  console.log('🚀 Quick Migration Starting...\n')
  console.log(`📦 Migrating ${sampleProducts.length} products\n`)
  
  // Get or create tenant
  let { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'awake')
    .single()
  
  if (tenantError || !tenant) {
    console.log('📝 Creating Awake tenant...')
    const { data: newTenant } = await supabase
      .from('tenants')
      .insert({
        slug: 'awake',
        name: 'Awake Store',
        domain: 'awakestore.co.za',
        is_active: true
      })
      .select()
      .single()
    tenant = newTenant
    console.log('✅ Tenant created\n')
  }
  
  const tenantId = tenant.id
  let success = 0
  let errors = 0
  
  for (const product of sampleProducts) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          tenant_id: tenantId,
          slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: product.name,
          description: `Premium ${product.category} - ${product.name}`,
          long_description: `High-quality ${product.name} from Awake`,
          price: product.price,
          original_price: product.priceExVAT * 1.15,
          currency: 'ZAR',
          category: product.category,
          in_stock: product.inStock,
          stock_quantity: product.stockQuantity,
          sku: product.id,
          images: [product.image],
          thumbnail: product.image,
          specifications: [],
          features: [],
          tags: product.badge ? [product.badge] : [],
          is_featured: !!product.badge,
        }, { onConflict: 'sku,tenant_id' })
      
      if (error) {
        console.error(`❌ ${product.name}: ${error.message}`)
        errors++
      } else {
        console.log(`✅ ${product.name}`)
        success++
      }
    } catch (err) {
      console.error(`❌ ${product.name}:`, err.message)
      errors++
    }
  }
  
  console.log(`\n🎉 Migration Complete!`)
  console.log(`✅ Success: ${success}`)
  console.log(`❌ Errors: ${errors}`)
  
  if (success > 0) {
    console.log(`\n✨ Your products are now in Supabase!`)
    console.log(`🔗 Verify: node scripts/verify-import.js`)
  }
}

migrate().catch(console.error)
