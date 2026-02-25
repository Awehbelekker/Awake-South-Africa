/**
 * CORRECT Migration - Uses ACTUAL Supabase schema
 * Based on src/types/supabase.ts products table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Sample of your 44 products
const products = [
  // Jetboards
  { name: 'Awake RÄVIK Explore XR 4', price: 280000, priceExVAT: 243478.26, category: 'Jetboards', image: '/images/ravik-explore.jpg' },
  { name: 'Awake RÄVIK Adventure XR 4', price: 330000, priceExVAT: 286956.52, category: 'Jetboards', image: '/images/ravik-adventure.jpg' },
  { name: 'Awake RÄVIK Ultimate XR 4', price: 403000, priceExVAT: 350434.78, category: 'Jetboards', image: '/images/ravik-ultimate.jpg' },
  { name: 'Awake RÄVIK S', price: 420000, priceExVAT: 365217.39, category: 'Jetboards', image: '/images/ravik-s.jpg',badge: 'Best Seller' },
  
  // Limited Edition
  { name: 'BRABUS Shadow (Limited)', price: 550000, priceExVAT: 478260.87, category: 'Limited Edition', image: '/images/brabus-shadow.jpg', badge: 'Limited' },
  
  // eFoils
  { name: 'Awake VINGA Adventure LR 4', price: 323000, priceExVAT: 280869.57, category: 'E-Foils', image: '/images/vinga-adventure-lr4.jpg' },
  { name: 'Awake VINGA Adventure XR 4', price: 363000, priceExVAT: 315652.17, category: 'E-Foils', image: '/images/vinga-adventure-xr4.jpg' },
  { name: 'Awake VINGA Ultimate LR 4', price: 350000, priceExVAT: 304347.83, category: 'E-Foils', image: '/images/vinga-ultimate-lr4.jpg' },
  { name: 'Awake VINGA Ultimate XR 4', price: 390000, priceExVAT: 339130.43, category: 'E-Foils', image: '/images/vinga-ultimate-xr4.jpg' },
  
  // Batteries
  { name: 'Awake Flex Battery LR 4 (90 min)', price: 79000, priceExVAT: 68695.65, category: 'Batteries', image: '/images/battery-lr4.jpg' },
  { name: 'Awake Flex Battery XR 4 (65 min)', price: 122000, priceExVAT: 106086.96, category: 'Batteries', image: '/images/battery-xr4.jpg' },
  { name: 'BRABUS Battery XR 4', price: 89325, priceExVAT: 77673.91, category: 'Batteries', image: '/images/brabus-battery.jpg' },
  
  // Boards Only
  { name: 'RÄVIK Explore (Board Only)', price: 133000, priceExVAT: 115652.17, category: 'Boards Only', image: '/images/ravik-board.jpg' },
  { name: 'RÄVIK Adventure (Board Only)', price: 214000, priceExVAT: 186086.96, category: 'Boards Only', image: '/images/ravik-adventure-board.jpg' },
  { name: 'RÄVIK Ultimate (Board Only)', price: 241000, priceExVAT: 209565.22, category: 'Boards Only', image: '/images/ravik-ultimate-board.jpg' },
  { name: 'VINGA Adventure (Board Only)', price: 241000, priceExVAT: 209565.22, category: 'Boards Only', image: '/images/vinga-adventure-board.jpg' },
  { name: 'VINGA Ultimate (Board Only)', price: 255000, priceExVAT: 221739.13, category: 'Boards Only', image: '/images/vinga-ultimate-board.jpg' },
  
  // Wings
  { name: 'CRUISE 1600 Wing Kit', price: 27200, priceExVAT: 23652.17, category: 'Wings', image: '/images/cruise-wing.jpg' },
  { name: 'POWDER 1800 Wing Kit', price: 27200, priceExVAT: 23652.17, category: 'Wings', image: '/images/powder-1800.jpg' },
  { name: 'POWDER 1400 Wing Kit', price: 27200, priceExVAT: 23652.17, category: 'Wings', image: '/images/powder-1400.jpg' },
  { name: 'FLUID 1300 Wing Kit', price: 25160, priceExVAT: 21878.26, category: 'Wings', image: '/images/fluid-1300.jpg' },
  { name: 'FLUID 1000 Wing Kit', price: 23460, priceExVAT: 20400.00, category: 'Wings', image: '/images/fluid-1000.jpg' },
  
  // Bags
  { name: 'Board Bag Kit (RÄVIK/VINGA)', price: 9265, priceExVAT: 8056.52, category: 'Bags', image: '/images/board-bag.jpg' },
  { name: 'Battery Bag', price: 2278, priceExVAT: 1981.74, category: 'Bags', image: '/images/battery-bag.jpg' },
  { name: 'Premium Travel Bag', price: 7990, priceExVAT: 6947.83, category: 'Bags', image: '/images/travel-bag.jpg' },
  
  // Safety & Storage
  { name: 'Life Vest (CE Certified)', price: 3400, priceExVAT: 2956.52, category: 'Safety & Storage', image: '/images/life-vest.jpg' },
  { name: 'Awake Dock (Floating)', price: 36700, priceExVAT: 31913.04, category: 'Safety & Storage', image: '/images/dock.jpg' },
  { name: 'Wall Mount', price: 5695, priceExVAT: 4952.17, category: 'Safety & Storage', image: '/images/wall-mount.jpg' },
  { name: 'Board Stand', price: 7990, priceExVAT: 6947.83, category: 'Safety & Storage', image: '/images/board-stand.jpg' },
  
  // Electronics
  { name: 'Flex Hand Controller', price: 15300, priceExVAT: 13304.35, category: 'Electronics', image: '/images/controller.jpg' },
  { name: 'Battery Charger', price: 5865, priceExVAT: 5100.00, category: 'Electronics', image: '/images/charger.jpg' },
  { name: 'Controller Charger', price: 2210, priceExVAT: 1921.74, category: 'Electronics', image: '/images/controller-charger.jpg' },
  
  // Parts
  { name: 'RÄVIK Fins (Set of 3)', price: 2975, priceExVAT: 2586.96, category: 'Parts', image: '/images/fins.jpg' },
  { name: 'Carbon Fins (Set of 3)', price: 2890, priceExVAT: 2513.04, category: 'Parts', image: '/images/carbon-fins.jpg' },
  { name: 'Foot Straps', price: 1615, priceExVAT: 1404.35, category: 'Parts', image: '/images/foot-straps.jpg' },
  { name: 'Beach Mat (5% duty)', price: 3145, priceExVAT: 2734.78, category: 'Parts', image: '/images/beach-mat.jpg' },
  { name: 'Awake Jetboard Tube', price: 3995, priceExVAT: 3473.91, category: 'Parts', image: '/images/tube.jpg' },
  { name: 'Competition Power Key', price: 1785, priceExVAT: 1552.17, category: 'Parts', image: '/images/power-key.jpg' },
  { name: 'Awake Power Key Leash', price: 425, priceExVAT: 369.57, category: 'Parts', image: '/images/key-leash.jpg' },
  
  // Apparel
  { name: 'Awake T-shirt', price: 641, priceExVAT: 557.39, category: 'Apparel', image: '/images/tshirt.jpg' },
  { name: 'Awake Cap', price: 340, priceExVAT: 295.65, category: 'Apparel', image: '/images/cap.jpg' },
  { name: 'Awake Wetsuit', price: 5185, priceExVAT: 4508.70, category: 'Apparel', image: '/images/wetsuit.jpg' },
  { name: "Awake Lady's Neo Suit", price: 5270, priceExVAT: 4582.61, category: 'Apparel', image: '/images/lady-neosuit.jpg' },
  { name: 'Awake Neo Jacket', price: 2720, priceExVAT: 2365.22, category: 'Apparel', image: '/images/neo-jacket.jpg' },
]

async function migrate() {
  console.log('🚀 CORRECT Migration Starting...')
  console.log(`📦 Migrating ${products.length} products\n`)
  
  // Get or create tenant
  let { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'awake')
  
  let tenantId
  if (!tenants || tenants.length === 0) {
    console.log('📝 Creating Awake tenant...')
    const { data, error } = await supabase
      .from('tenants')
      .insert({ slug: 'awake', name: 'Awake Store', domain: 'awakestore.co.za', is_active: true })
      .select()
    
    if (error) {
      console.error('❌ Tenant creation failed:', error)
      process.exit(1)
    }
    tenantId = data[0].id
    console.log(`✅ Tenant created: ${tenantId}\n`)
  } else {
    tenantId = tenants[0].id
    console.log(`✅ Using tenant: ${tenantId}\n`)
  }
  
  let success = 0
  let errors = 0
  
  for (const product of products) {
    try {
      // Use ONLY fields from actual schema
      const { error } = await supabase
        .from('products')
        .insert({
          tenant_id: tenantId,
          name: product.name,
          price: product.price,
          price_ex_vat: product.priceExVAT,
          category: product.category,
          description: `Premium ${product.category} - ${product.name}`,
         image: product.image,
          badge: product.badge || null,
          in_stock: true,
          stock_quantity: 5,
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
    console.log(`\n✨ ${success} products are now in Supabase!`)
    console.log(`🔗 Verify: node scripts/verify-import.js`)
  }
}

migrate().catch((err) => {
  console.error('💥 Migration failed:', err)
  process.exit(1)
})
