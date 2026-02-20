#!/usr/bin/env node
/**
 * Import Products to Supabase Database
 * Reads products from constants.ts and inserts them into Supabase
 */

console.log('🔍 Script starting...');

const { createClient } = require('@supabase/supabase-js');
console.log('✅ Supabase client loaded');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
console.log('✅ Environment loaded');

// Awake tenant ID from deployment
const AWAKE_TENANT_ID = '7f219734-0293-4dca-9c91-2f1a5aea78dd';

// Product data extracted from constants.ts
const PRODUCTS_DATA = {
  jetboards: [
    { id: "ravik-explore", name: "Awake RÄVIK Explore XR 4", price: 242000, category: "jetboards", description: "Entry-level electric jetboard with impressive performance. Perfect for beginners and families looking to experience the thrill of electric surfing.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik3.webp" },
    { id: "ravik-adventure", name: "Awake RÄVIK Adventure XR 4", price: 350000, category: "jetboards", description: "Mid-range performance jetboard for enthusiasts. Perfect balance of power and versatility for expedition rides and adventure seekers.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp" },
    { id: "ravik-ultimate", name: "Awake RÄVIK Ultimate XR 4", price: 403000, category: "jetboards", description: "Top-tier performance electric jetboard. Engineered for experienced riders who demand peak performance and agility on the water.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/Ultimate_1.png" },
    { id: "ravik-s", name: "Awake RÄVIK S", price: 257851, category: "jetboards", description: "Award-winning electric jetboard with exceptional performance. Perfect for riders seeking a balance of power and control.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp" },
  ],
  limitedEdition: [
    { id: "brabus-shadow-explore", name: "BRABUS Shadow (Limited)", price: 453000, category: "jetboards", description: "Exclusive BRABUS collaboration - luxury meets performance. One of only 77 limited edition boards worldwide. Features signature BRABUS design and premium finishes.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/brabus-explore.webp", featured: true },
  ],
  efoils: [
    { id: "vinga-adventure-lr4", name: "Awake VINGA Adventure LR 4", price: 323000, category: "efoils", description: "Extended range eFoil for long sessions. Perfect for learning and exploring the world of electric foiling with extended battery life.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp" },
    { id: "vinga-adventure-xr4", name: "Awake VINGA Adventure XR 4", price: 363000, category: "efoils", description: "Performance-focused eFoil with XR battery. Enhanced stability and range for longer explorations with compact design.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp" },
    { id: "vinga-ultimate-lr4", name: "Awake VINGA Ultimate LR 4", price: 350000, category: "efoils", description: "Advanced eFoil with extended ride time. Advanced performance and dynamic control for serious riders.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp" },
    { id: "vinga-ultimate-xr4", name: "Awake VINGA Ultimate XR 4", price: 390000, category: "efoils", description: "Top-spec eFoil with ultimate performance. For those seeking peak performance and control with competition-grade features.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp" },
  ],
  batteries: [
    { id: "flex-battery-lr4", name: "Awake Flex Battery LR 4 (90 min)", price: 79000, category: "batteries", description: "Long range battery - 90 minutes ride time. Perfect for extended sessions on the water with quick swap design.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/lr4-battery.webp" },
    { id: "flex-battery-xr4", name: "Awake Flex Battery XR 4 (65 min)", price: 122000, category: "batteries", description: "Extended range battery - 65 minutes ride time. Compact design with fast charging capability.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/flex-battery.webp" },
    { id: "brabus-battery-xr4", name: "BRABUS Battery XR 4", price: 89325, category: "batteries", description: "Exclusive BRABUS battery with signature styling. 65 minutes ride time with premium finishes.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/flex-battery.webp" },
  ],
  boardsOnly: [
    { id: "ravik-explore-board", name: "RÄVIK Explore (Board Only)", price: 133000, category: "boards", description: "Board without battery", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik3.webp" },
    { id: "ravik-adventure-board", name: "RÄVIK Adventure (Board Only)", price: 214000, category: "boards", description: "Board without battery", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp" },
    { id: "ravik-ultimate-board", name: "RÄVIK Ultimate (Board Only)", price: 241000, category: "boards", description: "Board without battery", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/Ultimate_1.png" },
    { id: "vinga-adventure-board", name: "VINGA Adventure (Board Only)", price: 241000, category: "boards", description: "Board without battery", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp" },
    { id: "vinga-ultimate-board", name: "VINGA Ultimate (Board Only)", price: 255000, category: "boards", description: "Board without battery", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp" },
  ],
  wings: [
    { id: "cruise-1600-wing-kit", name: "CRUISE 1600 Wing Kit", price: 27200, category: "wings", description: "CRUISE 1600 wing kit for versatile eFoil performance. Ideal for various water conditions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp" },
    { id: "powder-1800-wing-kit", name: "POWDER 1800 Wing Kit", price: 27200, category: "wings", description: "POWDER 1800 wing kit for versatile eFoil performance. Ideal for various water conditions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp" },
    { id: "powder-1400-wing-kit", name: "POWDER 1400 Wing Kit", price: 27200, category: "wings", description: "POWDER 1400 wing kit for versatile eFoil performance. Ideal for various water conditions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp" },
    { id: "fluid-1300-wing-kit", name: "FLUID 1300 Wing Kit", price: 27200, category: "wings", description: "FLUID 1300 wing kit for high-speed eFoil performance. Designed for speed and agility.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fluid-wing.webp" },
    { id: "fluid-1000-wing-kit", name: "FLUID 1000 Wing Kit", price: 27200, category: "wings", description: "FLUID 1000 wing kit for high-speed eFoil performance. Designed for speed and agility.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fluid-wing.webp" },
  ],
  bags: [
    { id: "board-bag-kit", name: "Board Bag Kit (RÄVIK/VINGA)", price: 19500, category: "accessories", description: "Protective bag kit for RÄVIK jetboards and VINGA eFoils. Includes board bag and accessories storage.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
    { id: "battery-bag", name: "Battery Bag", price: 9700, category: "accessories", description: "Dedicated battery bag for safe transport of Awake batteries.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-backpack.webp" },
    { id: "premium-travel-bag", name: "Premium Travel Bag", price: 16200, category: "accessories", description: "Premium travel bag for complete protection during transport.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
  ],
  safetyStorage: [
    { id: "life-vest", name: "Life Vest (CE Certified)", price: 9700, category: "accessories", description: "CE certified life vest designed for water sports. Safety meets style with Awake branding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/life-vest.webp" },
    { id: "awake-dock", name: "Awake Dock (Floating)", price: 78300, category: "accessories", description: "Floating dock system for easy water access. Perfect for launching and docking your Awake.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/inflatable-dock.webp" },
    { id: "wall-mount", name: "Wall Mount", price: 29600, category: "accessories", description: "Premium wall mounting system for RÄVIK boards. Display your board as art when not in use.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wall-mount.webp" },
    { id: "board-stand", name: "Board Stand", price: 16200, category: "accessories", description: "Premium board stand for displaying your Awake board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wall-mount.webp" },
  ],
  electronics: [
    { id: "flex-hand-controller", name: "Flex Hand Controller", price: 16300, category: "accessories", description: "Latest generation wireless hand controller with ergonomic design and precise throttle control.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/hand-controller.webp" },
    { id: "battery-charger", name: "Battery Charger", price: 24700, category: "accessories", description: "Fast battery charger for all Awake batteries. Charges LR 4 and XR 4 batteries efficiently.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/charger.webp" },
    { id: "controller-charger", name: "Controller Charger", price: 5700, category: "accessories", description: "Dedicated charger for Awake hand controllers with USB connectivity.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/controller-charger.webp" },
  ],
  parts: [
    { id: "ravik-fins", name: "RÄVIK Fins (Set of 3)", price: 5700, category: "accessories", description: "Standard fin set for RÄVIK jetboards. Set of 3 high-quality fins for optimal performance.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-fins.webp" },
    { id: "carbon-fins", name: "Carbon Fins (Set of 3)", price: 8100, category: "accessories", description: "Premium carbon fiber fin set. Lightweight and ultra-durable for maximum performance.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/carbon-fins.webp" },
    { id: "foot-straps", name: "Foot Straps", price: 8400, category: "accessories", description: "Adjustable foot straps for enhanced control and stability on your Awake board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/foot-straps.webp" },
    { id: "beach-mat", name: "Beach Mat (5% duty)", price: 5700, category: "accessories", description: "Portable beach mat for protecting your board and gear. Perfect for beach sessions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/beach-mat.webp" },
    { id: "jetboard-tube", name: "Awake Jetboard Tube", price: 11711, category: "accessories", description: "Inflatable tube accessory for towing behind your jetboard. Add extra fun to your sessions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/jetboard-tube.webp" },
    { id: "competition-power-key", name: "Competition Power Key", price: 3771, category: "accessories", description: "Competition power key for unlocking maximum performance on your Awake board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/competition-key.webp" },
    { id: "power-key-leash", name: "Awake Power Key Leash", price: 3771, category: "accessories", description: "Safety leash for your power key. Prevents loss during water sessions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/power-key-leash.webp" },
  ],
  apparel: [
    { id: "tshirt", name: "T-shirt", price: 3300, category: "apparel", description: "Official Awake branded t-shirt. Premium quality cotton with Awake logo.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tshirt.webp" },
    { id: "cap", name: "Cap", price: 1700, category: "apparel", description: "Branded Awake cap. Perfect for sunny days on the water.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/cap.webp" },
    { id: "wetsuit", name: "Awake Wetsuit", price: 7741, category: "apparel", description: "Full wetsuit designed for water sports. 4/3mm thickness for year-round comfort.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp" },
    { id: "ladys-neo-suit", name: "Awake Lady's Neo Suit", price: 3771, category: "apparel", description: "Women's neoprene suit designed for comfort and style on the water.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ladys-neo-suit.webp" },
    { id: "neo-jacket", name: "Awake Neo Jacket", price: 3771, category: "apparel", description: "Neoprene jacket for layering. Perfect for cooler water conditions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/neo-jacket.webp" },
  ],
};

async function importProducts() {
  console.log('🚀 Importing Products to Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Flatten all products
  const allProducts = [];
  Object.entries(PRODUCTS_DATA).forEach(([categoryType, products]) => {
    products.forEach(product => {
      allProducts.push({
        tenant_id: AWAKE_TENANT_ID,
        slug: product.id,
        name: product.name,
        price: product.price / 100, // Convert cents to rands
        description: product.description,
        category: product.category,
        images: [product.image],
        thumbnail: product.image,
        currency: 'ZAR',
        in_stock: true,
        stock_quantity: 10,
        is_featured: product.featured || false,
        is_new: false,
        is_on_sale: false,
      });
    });
  });

  console.log(`📦 Found ${allProducts.length} products to import\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const product of allProducts) {
    try {
      const { error } = await supabase
        .from('products')
        .insert([product]);

      if (error) {
        console.error(`❌ Failed: ${product.name} - ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Imported: ${product.name}`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error: ${product.name} - ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`✅ Success: ${successCount} products`);
  console.log(`❌ Failed: ${errorCount} products\n`);
}

importProducts();
