#!/usr/bin/env node
/**
 * Add test products for Kelp and Off the Hook tenants
 * This allows us to test multi-tenant filtering
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Tenant IDs from deployment
const TENANTS = {
  kelp: '48fd8da0-41e0-4c62-a898-71a45457c827',
  offTheHook: 'c771fd24-301a-4f78-8aa0-6a7c871dc048',
  awehBeLekker: '1e98251c-9ffa-43d1-b322-c6e4d90e2174'
};

// Sample products for each client
const KELP_PRODUCTS = [
  {
    tenant_id: TENANTS.kelp,
    slug: 'kelp-starter-pack',
    name: 'Kelp Starter Surfboard',
    price: 8500,
    description: 'Perfect starter surfboard for beginners. Durable and easy to handle.',
    category: 'surfboards',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/surfboard.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/surfboard.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 12,
    is_featured: true,
  },
  {
    tenant_id: TENANTS.kelp,
    slug: 'kelp-wetsuit-pro',
    name: 'Kelp Pro Wetsuit 3/2mm',
    price: 2500,
    description: 'High-performance wetsuit for cold water surfing.',
    category: 'apparel',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/wetsuit.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 25,
    is_featured: false,
  },
  {
    tenant_id: TENANTS.kelp,
    slug: 'kelp-leash-premium',
    name: 'Kelp Premium Surf Leash',
    price: 450,
    description: 'Strong and reliable surf leash for all conditions.',
    category: 'accessories',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/leash.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/leash.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 50,
    is_featured: false,
  }
];

const OFF_THE_HOOK_PRODUCTS = [
  {
    tenant_id: TENANTS.offTheHook,
    slug: 'oth-fishing-rod-pro',
    name: 'Off The Hook Pro Fishing Rod',
    price: 3200,
    description: 'Professional-grade fishing rod for serious anglers.',
    category: 'fishing-gear',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fishing-rod.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/fishing-rod.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 15,
    is_featured: true,
  },
  {
    tenant_id: TENANTS.offTheHook,
    slug: 'oth-tackle-box-deluxe',
    name: 'Deluxe Tackle Box Set',
    price: 1800,
    description: 'Complete tackle box with organized compartments.',
    category: 'fishing-gear',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tackle-box.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/tackle-box.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 20,
    is_featured: false,
  },
  {
    tenant_id: TENANTS.offTheHook,
    slug: 'oth-bait-selection',
    name: 'Premium Bait Selection Pack',
    price: 650,
    description: 'Variety pack of premium fishing bait for different conditions.',
    category: 'fishing-gear',
    images: ['https://cdn.shopify.com/s/files/1/0074/9305/6546/files/bait.webp'],
    thumbnail: 'https://cdn.shopify.com/s/files/1/0074/9305/6546/files/bait.webp',
    currency: 'ZAR',
    in_stock: true,
    stock_quantity: 100,
    is_featured: false,
  }
];

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject({ success: false, statusCode: res.statusCode, message: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function importTestProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🧪 Adding test products for multi-tenant testing...\n');

  const allProducts = [
    ...KELP_PRODUCTS.map(p => ({ ...p, tenantName: 'Kelp' })),
    ...OFF_THE_HOOK_PRODUCTS.map(p => ({ ...p, tenantName: 'Off the Hook' }))
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const product of allProducts) {
    try {
      const { tenantName, ...productData } = product; // Remove tenantName before sending
      await insertProduct(productData, supabaseUrl, supabaseKey);
      console.log(`✅ Added: [${tenantName}] ${product.name}`);
      successCount++;
    } catch (error) {
      if (error.statusCode === 409) {
        console.log(`⏭️  Skipped: [${product.tenantName}] ${product.name} (already exists)`);
      } else {
        console.error(`❌ Failed: [${product.tenantName}] ${product.name}`);
        if (error.message) console.error(`   Error: ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}\n`);
}

importTestProducts();
