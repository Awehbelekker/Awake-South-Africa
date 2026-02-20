#!/usr/bin/env node
/**
 * Import Products to Supabase Database using REST API
 * Bypasses the Supabase JS client to avoid import issues
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

console.log('🚀 Starting product import...\n');

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
    { id: "lr4-battery", name: "LR 4 Battery", price: 39700, category: "accessories", description: "Extended range battery for longer sessions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery.webp" },
    { id: "xr4-battery", name: "XR 4 Battery", price: 46500, category: "accessories", description: "Extra extended range battery for maximum ride time.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery.webp" },
    { id: "battery-charger", name: "Battery Charger", price: 10500, category: "accessories", description: "Fast charging solution for your Awake batteries.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/charger.webp" },
  ],
  boardsOnly: [
    { id: "ravik-board-only", name: "RÄVIK Board Only", price: 85000, category: "boards", description: "Replacement board deck for RÄVIK series.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-board.webp" },
    { id: "vinga-board-only", name: "VINGA Board Only", price: 82300, category: "boards", description: "Replacement board deck for VINGA eFoil.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga-board.webp" },
    { id: "ravik-explore-board", name: "RÄVIK Explore Board", price: 78000, category: "boards", description: "Explore series board deck replacement.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-board.webp" },
    { id: "ravik-adventure-board", name: "RÄVIK Adventure Board", price: 91000, category: "boards", description: "Adventure series board deck replacement.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-board.webp" },
    { id: "ravik-ultimate-board", name: "RÄVIK Ultimate Board", price: 103000, category: "boards", description: "Ultimate series board deck replacement.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-board.webp" },
  ],
  wings: [
    { id: "wing-650", name: "Wing 650", price: 16200, category: "accessories", description: "Small wing for advanced riders.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing.webp" },
    { id: "wing-800", name: "Wing 800", price: 17300, category: "accessories", description: "Medium wing for versatile riding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing.webp" },
    { id: "wing-1000", name: "Wing 1000", price: 18500, category: "accessories", description: "Large wing for easy learning.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing.webp" },
    { id: "wing-1200", name: "Wing 1200", price: 19800, category: "accessories", description: "Extra large wing for beginners.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing.webp" },
    { id: "wing-set", name: "Complete Wing Set", price: 68000, category: "accessories", description: "All four wing sizes for ultimate versatility.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing.webp" },
  ],
  bags: [
    { id: "board-bag-kit", name: "Board Bag Kit (RÄVIK/VINGA)", price: 19500, category: "accessories", description: "Protective bag kit for RÄVIK jetboards and VINGA eFoils. Includes board bag and accessories storage.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
    { id: "battery-bag", name: "Battery Bag", price: 9700, category: "accessories", description: "Dedicated battery bag for safe transport of Awake batteries.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-backpack.webp" },
    { id: "premium-travel-bag", name: "Premium Travel Bag", price: 16200, category: "accessories", description: "Premium travel bag for complete protection during transport.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
  ],
  safetyStorage: [
    { id: "safety-leash", name: "Safety Leash", price: 2700, category: "accessories", description: "Essential safety leash for secure connection to board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/leash.webp" },
    { id: "life-vest", name: "Impact Vest", price: 6500, category: "accessories", description: "Premium impact vest for rider protection and flotation.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vest.webp" },
    { id: "helmet", name: "Water Sports Helmet", price: 5400, category: "accessories", description: "Professional water sports helmet for safety.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/helmet.webp" },
    { id: "storage-rack", name: "Wall Storage Rack", price: 8100, category: "accessories", description: "Premium wall-mounted storage rack for your Awake board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/rack.webp" },
  ],
  electronics: [
    { id: "remote-control", name: "Wireless Remote", price: 8100, category: "accessories", description: "Replacement wireless remote control.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/remote.webp" },
    { id: "display-module", name: "Display Module", price: 5400, category: "accessories", description: "Replacement display module for board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/display.webp" },
    { id: "battery-management", name: "Battery Management System", price: 12150, category: "accessories", description: "Advanced battery management and monitoring system.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/bms.webp" },
  ],
  parts: [
    { id: "jet-propeller", name: "Jet Propeller", price: 13500, category: "parts", description: "Replacement propeller for RÄVIK jetboards.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/propeller.webp" },
    { id: "motor-unit", name: "Motor Unit", price: 54000, category: "parts", description: "Complete motor unit replacement.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/motor.webp" },
    { id: "foil-mast", name: "Foil Mast", price: 21600, category: "parts", description: "Carbon fiber mast for VINGA eFoil.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/mast.webp" },
    { id: "foil-fuselage", name: "Foil Fuselage", price: 16200, category: "parts", description: "Carbon fiber fuselage for eFoil connection.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fuselage.webp" },
    { id: "footstraps", name: "Footstraps", price: 2700, category: "parts", description: "Premium footstraps for secure stance.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/straps.webp" },
    { id: "fin-set", name: "Fin Set", price: 4050, category: "parts", description: "Complete fin set for enhanced stability.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fins.webp" },
    { id: "maintenance-kit", name: "Maintenance Kit", price: 6750, category: "parts", description: "Complete maintenance kit with essential tools and parts.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tools.webp" },
  ],
  apparel: [
    { id: "rashguard", name: "Awake Rashguard", price: 2700, category: "apparel", description: "Premium UV protection rashguard.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/rashguard.webp" },
    { id: "wetsuit", name: "Performance Wetsuit", price: 8100, category: "apparel", description: "High-performance wetsuit for cold water riding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp" },
    { id: "tshirt", name: "Awake T-Shirt", price: 1350, category: "apparel", description: "Premium cotton t-shirt with Awake branding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tshirt.webp" },
    { id: "cap", name: "Awake Cap", price: 1080, category: "apparel", description: "Classic cap with embroidered logo.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/cap.webp" },
    { id: "hoodie", name: "Awake Hoodie", price: 3240, category: "apparel", description: "Premium hoodie with Awake branding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/hoodie.webp" },
  ],
};

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

// Function to make POST request to Supabase REST API
function insertProduct(product, supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products`);
    
    const postData = JSON.stringify(product);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          reject({ success: false, statusCode: res.statusCode, message: data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, message: error.message });
    });

    req.write(postData);
    req.end();
  });
}

// Main import function
async function importProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
  }

  console.log('✅ Environment configured\n');

  let successCount = 0;
  let errorCount = 0;

  for (const product of allProducts) {
    try {
      await insertProduct(product, supabaseUrl, supabaseKey);
      console.log(`✅ Imported: ${product.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${product.name}`);
      if (error.message) {
        console.error(`   Error: ${error.message}`);
      }
      if (error.statusCode) {
        console.error(`   Status: ${error.statusCode}`);
      }
      errorCount++;
    }
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`✅ Success: ${successCount} products`);
  console.log(`❌ Failed: ${errorCount} products\n`);
}

// Run the import
importProducts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
