/**
 * Import products to Medusa via Admin API
 * 
 * Usage: node scripts/import-products.js
 * 
 * This script reads products from seed.json and creates them via the Medusa Admin API.
 * It bypasses the broken `medusa seed` command.
 */

const fs = require('fs');
const path = require('path');

const MEDUSA_URL = process.env.MEDUSA_URL || 'https://awake-south-africa-production.up.railway.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@awakesa.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'awake2026admin';

async function getAuthToken() {
  console.log('🔐 Authenticating with Medusa Admin...');
  
  const response = await fetch(`${MEDUSA_URL}/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  
  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status} ${await response.text()}`);
  }
  
  // Get the session cookie
  const cookies = response.headers.get('set-cookie');
  console.log('✅ Authenticated successfully');
  return cookies;
}

async function getExistingProducts(cookie) {
  const response = await fetch(`${MEDUSA_URL}/admin/products?limit=100`, {
    headers: { 'Cookie': cookie }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get products: ${response.status}`);
  }
  
  const data = await response.json();
  return data.products || [];
}

async function createProduct(product, cookie) {
  // Transform seed.json format to Medusa Admin API format
  const productData = {
    title: product.title,
    subtitle: product.subtitle,
    description: product.description,
    handle: product.handle,
    is_giftcard: product.is_giftcard || false,
    weight: product.weight,
    metadata: product.metadata,
    images: product.images,
    options: product.options?.map(o => ({ title: o.title })) || [],
    variants: product.variants?.map(v => ({
      title: v.title,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity || 10,
      prices: v.prices?.map(p => ({
        amount: p.amount,
        currency_code: p.currency_code
      })) || [],
      options: v.options?.map(o => ({ value: o.value })) || [],
      metadata: v.metadata
    })) || []
  };

  const response = await fetch(`${MEDUSA_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product "${product.title}": ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  console.log('🚀 Starting product import...\n');
  
  // Read seed.json
  const seedPath = path.join(__dirname, '../services/medusa/data/seed.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const products = seedData.products || [];
  
  console.log(`📦 Found ${products.length} products in seed.json\n`);
  
  // Authenticate
  const cookie = await getAuthToken();
  
  // Get existing products
  const existingProducts = await getExistingProducts(cookie);
  const existingHandles = new Set(existingProducts.map(p => p.handle));
  console.log(`📋 Found ${existingProducts.length} existing products in Medusa\n`);
  
  // Import products
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const product of products) {
    if (existingHandles.has(product.handle)) {
      console.log(`⏭️  Skipping "${product.title}" (already exists)`);
      skipped++;
      continue;
    }
    
    try {
      await createProduct(product, cookie);
      console.log(`✅ Created "${product.title}"`);
      created++;
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Import Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed:  ${failed}`);
  console.log(`   Total:   ${products.length}`);
}

main().catch(console.error);

