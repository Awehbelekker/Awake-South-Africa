/**
 * FIXED Migration - Works with existing Supabase schema
 * Removes problematic fields like 'currency' that don't exist
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Your 44 products (sample - using core products)
const products = [
  // Jetboards
  { id: 'ravik-explore-xr4', name: 'Awake RÄVIK Explore XR 4', price: 280000, category: 'Jetboards', image: '/images/ravik-explore.jpg', inStock: true, stockQuantity: 3 },
  { id: 'ravik-adventure-xr4', name: 'Awake RÄVIK Adventure XR 4', price: 330000, category: 'Jetboards', image: '/images/ravik-adventure.jpg', inStock: true, stockQuantity: 2 },
  { id: 'ravik-s', name: 'Awake RÄVIK S', price: 420000, category: 'Jetboards', image: '/images/ravik-s.jpg', inStock: true, stockQuantity: 1 },
  { id: 'vinga-adventure-lr4', name: 'Awake VINGA Adventure LR 4', price: 200000, category: 'Jetboards', image: '/images/vinga-adventure-lr4.jpg', inStock: true, stockQuantity: 5 },
  { id: 'vinga-ultimate-xr4', name: 'Awake VINGA Ultimate XR 4', price: 250000, category: 'Jetboards', image: '/images/vinga-ultimate-xr4.jpg', inStock: true, stockQuantity: 3 },
  
  // Limited Edition
  { id: 'brabus-shadow', name: 'BRABUS Shadow (Limited)', price: 550000, category: 'Limited Edition', image: '/images/brabus-shadow.jpg', inStock: true, stockQuantity: 1 },
  
  // Batteries
  { id: 'battery-lr4', name: 'Awake Flex Battery LR 4 (90 min)', price: 45000, category: 'Batteries', image: '/images/battery-lr4.jpg', inStock: true, stockQuantity: 8 },
  { id: 'battery-xr4', name: 'Awake Flex Battery XR 4 (65 min)', price: 40000, category: 'Batteries', image: '/images/battery-xr4.jpg', inStock: true, stockQuantity: 10 },
  
  // Board Only
  { id: 'ravik-board', name: 'RÄVIK Explore (Board Only)', price: 95000, category: 'Boards Only', image: '/images/ravik-board.jpg', inStock: true, stockQuantity: 4 },
  { id: 'vinga-board', name: 'VINGA Adventure (Board Only)', price: 75000, category: 'Boards Only', image: '/images/vinga-board.jpg', inStock: true, stockQuantity: 6 },
  
  // Wings & Accessories
  { id: 'cruise-wing', name: 'CRUISE 1600 Wing Kit', price: 25000, category: 'Wings', image: '/images/cruise-wing.jpg', inStock: true, stockQuantity: 4 },
  { id: 'board-bag', name: 'Board Bag Kit (RÄVIK/VINGA)', price: 8500, category: 'Bags', image: '/images/board-bag.jpg', inStock: true, stockQuantity: 12 },
  { id: 'life-vest', name: 'Life Vest (CE Certified)', price: 3200, category: 'Safety & Storage', image: '/images/life-vest.jpg', inStock: true, stockQuantity: 20 },
  { id: 'hand-controller', name: 'Flex Hand Controller', price: 12000, category: 'Electronics', image: '/images/controller.jpg', inStock: true, stockQuantity: 8 },
  { id: 'battery-charger', name: 'Battery Charger', price: 4500, category: 'Electronics', image: '/images/charger.jpg', inStock: true, stockQuantity: 15 },
  { id: 'fins-set', name: 'RÄVIK Fins (Set of 3)', price: 2800, category: 'Parts', image: '/images/fins.jpg', inStock: true, stockQuantity: 25 },
  { id: 'foot-straps', name: 'Foot Straps', price: 1500, category: 'Parts', image: '/images/foot-straps.jpg', inStock: true, stockQuantity: 30 },
  { id: 'tshirt', name: 'Awake T-shirt', price: 650, category: 'Apparel', image: '/images/tshirt.jpg', inStock: true, stockQuantity: 100 },
]

async function migrate() {
  console.log('🚀 FIXED Migration Starting...\n')
  console.log(`📦 Migrating ${products.length} products\n`)
  
  // Get or create tenant
  let { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'awake')
    .single()
  
  if (tenantError || !tenant) {
    console.log('📝 Creating Awake tenant...')
    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({ slug: 'awake', name: 'Awake Store', domain: 'awakestore.co.za', is_active: true })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Failed to create tenant:', createError)
      process.exit(1)
    }
    
    tenant = newTenant
    console.log(`✅ Tenant created with ID: ${tenant.id}\n`)
  } else {
    console.log(`✅ Using existing tenant ID: ${tenant.id}\n`)
  }
  
  const tenantId = tenant.id
  let success = 0
  let errors = 0
  
  for (const product of products) {
    try {
      // Use ONLY fields that exist in the schema
      const { error } = await supabase
        .from('products')
        .insert({
          tenant_id: tenantId,
          name: product.name,
          price: product.price,
          category: product.category,
          thumbnail: product.image,
          in_stock: product.inStock,
          stock_quantity: product.stockQuantity,
          sku: product.id,
          slug: product.id,
          description: `Premium ${product.category} -${product.name}`,
        })
      
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
  
  console.log(`\n🎉 MIGRATION COMPLETE!`)
  console.log(`✅ Success: ${success}/${products.length}`)
  console.log(`❌ Errors: ${errors}`)
  
  if (success > 0) {
    console.log(`\n✨ Products are now in Supabase database!`)
  }
}

migrate().catch(console.error)
