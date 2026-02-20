#!/usr/bin/env node
/**
 * Import Products to Supabase Database
 * Reads products from constants.ts and inserts them into Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

console.log('🚀 Importing Products to Supabase...\n');

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
    { id: "lr3-battery", name: "LR 3 Battery", price: 55000, category: "batteries", description: "Standard range battery pack for Awake boards. Reliable power for everyday riding and adventure.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-pack.webp" },
    { id: "lr4-battery", name: "LR 4 Battery", price: 61000, category: "batteries", description: "Enhanced capacity battery for extended ride sessions. Perfect for longer adventures and explorations.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-pack.webp" },
    { id: "xr4-battery", name: "XR 4 Battery", price: 92000, category: "batteries", description: "Extended range battery for maximum ride time. Premium power solution for serious riders.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-pack.webp" },
  ],
  boardsOnly: [
    { id: "ravik-explore-board", name: "RÄVIK Explore Board Only", price: 181000, category: "boards", description: "RÄVIK Explore board without battery. Perfect for existing Awake owners looking for a backup board.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik3.webp" },
    { id: "ravik-adventure-board", name: "RÄVIK Adventure Board Only", price:  289000, category: "boards", description: "RÄVIK Adventure board without battery. Mid-performance board for enthusiasts who already have batteries.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp" },
    { id: "ravik-ultimate-board", name: "RÄVIK Ultimate Board Only", price: 342000, category: "boards", description: "RÄVIK Ultimate board without battery. Top-tier performance for serious riders upgrading their setup.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/Ultimate_1.png" },
    { id: "vinga-adventure-board", name: "VINGA Adventure Board Only", price: 262000, category: "boards", description: "VINGA Adventure eFoil board without battery. Performance foiling for existing battery owners.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp" },
    { id: "vinga-ultimate-board", name: "VINGA Ultimate Board Only", price: 289000, category: "boards", description: "VINGA Ultimate eFoil board without battery. Top-spec foiling setup for competitive riders.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp" },
  ],
  wings: [
    { id: "comfort-wing-1200", name: "Comfort Wing 1200", price: 17000, category: "accessories", description: "Large wing for stable, comfortable foiling. Perfect for beginners and cruising.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing-comfort.webp" },
    { id: "performance-wing-1000", name: "Performance Wing 1000", price: 17000, category: "accessories", description: "Balanced wing for all-around performance. Versatile choice for various conditions.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing-performance.webp" },
    { id: "sport-wing-800", name: "Sport Wing 800", price: 17000, category: "accessories", description: "Agile wing for dynamic riding. Preferred by experienced riders seeking responsiveness.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing-sport.webp" },
    { id: "race-wing-600", name: "Race Wing 600", price: 17000, category: "accessories", description: "Compact high-speed wing for racing. Maximum performance for competitive foiling.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wing-race.webp" },
    { id: "mast", name: "Aluminum Mast", price: 22000, category: "accessories", description: "High-quality aluminum mast for VINGA eFoils. Durable and responsive.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/mast.webp" },
  ],
  bags: [
    { id: "board-bag-kit", name: "Board Bag Kit (RÄVIK/VINGA)", price: 19500, category: "accessories", description: "Protective bag kit for RÄVIK jetboards and VINGA eFoils. Includes board bag and accessories storage.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
    { id: "battery-bag", name: "Battery Bag", price: 9700, category: "accessories", description: "Dedicated battery bag for safe transport of Awake batteries.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-backpack.webp" },
    { id: "premium-travel-bag", name: "Premium Travel Bag", price: 16200, category: "accessories", description: "Premium travel bag for complete protection during transport.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp" },
  ],
  safetyStorage: [
    { id: "lifejacket", name: "Life Jacket", price: 3850, category: "safety", description: "High-quality life jacket for water sports. Essential safety equipment for all riders.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/lifejacket.webp" },
    { id: "helmet", name: "Water Sports Helmet", price: 2900, category: "safety", description: "Protective helmet designed for water sports. Maximum safety without compromising comfort.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/helmet.webp" },
    { id: "wetsuit", name: "Wetsuit", price: 4500, category: "safety", description: "Premium wetsuit for extended water sessions. Thermal protection and flexibility.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp" },
    { id: "storage-dock", name: "Storage Dock", price: 12000, category: "accessories", description: "Secure storage dock for your Awake board. Protects and organizes your equipment.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/storage-dock.webp" },
  ],
  electronics: [
    { id: "waterproof-remote", name: "Waterproof Remote", price: 8500, category: "electronics", description: "Replacement waterproof remote control. Essential for board operation.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/remote.webp" },
    { id: "battery-charger", name: "Fast Battery Charger", price: 15000, category: "electronics", description: "High-speed charger for Awake batteries. Rapid charging for minimal downtime.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/charger.webp" },
    { id: "action-camera-mount", name: "Action Camera Mount", price: 1200, category: "electronics", description: "Universal mount for action cameras. Capture your rides from the best angles.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/camera-mount.webp" },
  ],
  parts: [
    { id: "jet-propeller", name: "Jet Propeller", price: 4500, category: "parts", description: "Replacement jet propeller for RÄVIK boards. Precision-engineered for optimal performance.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/propeller.webp" },
    { id: "intake-grate", name: "Intake Grate", price: 2200, category: "parts", description: "Replacement intake grate. Protects jet system from debris.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/intake.webp" },
    { id: "deck-pad", name: "Deck Pad Set", price: 3200, category: "parts", description: "Premium EVA deck pads. Enhanced grip and comfort for riding.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/deck-pad.webp" },
    { id: "footstrap-set", name: "Footstrap Set", price: 1800, category: "parts", description: "Adjustable footstraps for secure riding. Essential for aggressive maneuvering.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/footstraps.webp" },
    { id: "fin-set", name: "Performance Fin Set", price: 2500, category: "parts", description: "High-performance fins for enhanced control. Designed for stability and maneuverability.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fins.webp" },
    { id: "seal-kit", name: "Seal Kit", price: 1500, category: "parts", description: "Complete seal kit for maintenance. Ensures watertight integrity.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/seal-kit.webp" },
    { id: "battery-cable", name: "Battery Cable", price: 850, category: "parts", description: "Replacement battery connection cable. High-quality components for reliable power delivery.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-cable.webp" },
  ],
  apparel: [
    { id: "rash-guard", name: "Awake Rash Guard", price: 1200, category: "apparel", description: "Premium rash guard with Awake branding. UV protection and quick-dry fabric.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/rashguard.webp" },
    { id: "board-shorts", name: "Board Shorts", price: 980, category: "apparel", description: "Technical board shorts for water sports. Lightweight and fast-drying.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/shorts.webp" },
    { id: "cap", name: "Awake Cap", price: 450, category: "apparel", description: "Adjustable cap with Awake logo. Quick-dry material for water and sun.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/cap.webp" },
    { id: "t-shirt", name: "Awake T-Shirt", price: 550, category: "apparel", description: "Premium cotton t-shirt with Awake graphics. Comfortable casual wear.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tshirt.webp" },
    { id: "hoodie", name: "Awake Hoodie", price: 1350, category: "apparel", description: "Comfortable hoodie with Awake branding. Perfect for after your ride.", image: "https://cdn.shopify.com/s/files/1/0074/9305/6546/files/hoodie.webp" },
  ],
};

async function importProducts() {
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
