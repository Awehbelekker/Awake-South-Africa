#!/usr/bin/env node
/**
 * COMPLETE IMAGE UPDATE - Push Official Awake Images to Supabase
 * Updates ALL 44 products with proper Shopify CDN URLs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Official Awake product images from Shopify CDN - Complete mapping
const OFFICIAL_IMAGES = {
  // Jetboards
  'Awake RÄVIK Explore XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik3.webp',
  'Awake RÄVIK Adventure XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp',
  'Awake RÄVIK Ultimate XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/Ultimate_1.png',
  'BRABUS Shadow (Limited Edition)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/brabus-explore.webp',
  
  // eFoils
  'Awake VINGA Adventure LR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp',
  'Awake VINGA Adventure XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp',
  'Awake VINGA Ultimate LR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp',
  'Awake VINGA Ultimate XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp',
  
  // Batteries
  'Awake Flex Battery LR 4 (90 min)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/lr4-battery.webp',
  'Awake Flex Battery XR 4 (65 min)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/flex-battery.webp',
  'BRABUS Battery XR 4': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/flex-battery.webp',
  
  // Boards Only
  'RÄVIK Explore (Board Only)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik3.webp',
  'RÄVIK Adventure (Board Only)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik_s.webp',
  'RÄVIK Ultimate (Board Only)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/Ultimate_1.png',
  'VINGA Adventure (Board Only)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/vinga.webp',
  'VINGA Ultimate (Board Only)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ultimate_vinga.webp',
  
  // Wings
  'CRUISE 1600 Wing Kit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp',
  'POWDER 1800 Wing Kit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp',
  'POWDER 1400 Wing Kit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/powder-wing.webp',
  'FLUID 1300 Wing Kit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fluid-wing.webp',
  'FLUID 1000 Wing Kit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fluid-wing.webp',
  
  // Bags
  'Board Bag Kit (RÄVIK/VINGA)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp',
  'Battery Bag': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/battery-backpack.webp',
  'Premium Travel Bag': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/board-bag.webp',
  
  // Safety & Storage
  'Life Vest (CE Certified)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/life-vest.webp',
  'Awake Dock (Floating)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/inflatable-dock.webp',
  'Wall Mount': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wall-mount.webp',
  'Board Stand': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wall-mount.webp',
  
  // Electronics
  'Flex Hand Controller': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/hand-controller.webp',
  'Battery Charger': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/charger.webp',
  'Controller Charger': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/controller-charger.webp',
  
  // Parts
  'RÄVIK Fins (Set of 3)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ravik-fins.webp',
  'Carbon Fins (Set of 3)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/carbon-fins.webp',
  'Foot Straps': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/foot-straps.webp',
  'Beach Mat (5% duty)': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/beach-mat.webp',
  'Awake Jetboard Tube': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/jetboard-tube.webp',
  'Competition Power Key': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/competition-key.webp',
  'Awake Power Key Leash': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/power-key-leash.webp',
  
  // Apparel
  'Awake T-shirt': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tshirt.webp',
  'Awake Cap': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/cap.webp',
  'Awake Wetsuit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp',
  'Awake Lady\'s Neo Suit': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/ladys-neo-suit.webp',
  'Awake Neo Jacket': 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/neo-jacket.webp',
};

async function updateAllProductImages() {
  console.log('🎨 Updating ALL Product Images with Official Shopify URLs\n');
  
  try {
    // Get Awake tenant
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'awake');
    
    if (tenantError || !tenants || tenants.length === 0) {
      console.error('❌ Could not find Awake tenant');
      return;
    }
    
    const tenantId = tenants[0].id;
    console.log(`✅ Found tenant: ${tenantId}\n`);
    
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image')
      .eq('tenant_id', tenantId);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    console.log(`📦 Found ${products.length} products\n`);
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    
    for (const product of products) {
      const officialImage = OFFICIAL_IMAGES[product.name];
      
      if (!officialImage) {
        console.log(`⚠️  No mapping for: ${product.name}`);
        notFound++;
        continue;
      }
      
      // Check if already has correct image
      if (product.image === officialImage) {
        console.log(`⏭️  Already updated: ${product.name}`);
        skipped++;
        continue;
      }
      
      // Update product image
      const { error: updateError } = await supabase
        .from('products')
        .update({ image: officialImage })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`❌ Failed to update ${product.name}:`, updateError.message);
      } else {
        console.log(`✅ Updated: ${product.name}`);
        updated++;
      }
    }
    
    console.log('\n🎉 IMAGE UPDATE COMPLETE!');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped} (already correct)`);
    console.log(`⚠️  Not found: ${notFound}`);
    console.log(`\n📊 Total products: ${products.length}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

updateAllProductImages();
