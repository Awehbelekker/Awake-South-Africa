#!/usr/bin/env node
/**
 * Clean up duplicate products in Supabase
 * Keeps the oldest entry for each slug
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const AWAKE_TENANT_ID = '7f219734-0293-4dca-9c91-2f1a5aea78dd';

function queryProducts(supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?tenant_id=eq.${AWAKE_TENANT_ID}&select=id,slug,created_at&order=created_at.asc`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({ statusCode: res.statusCode, message: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function deleteProduct(productId, supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?id=eq.${productId}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ success: true });
      } else {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => reject({ statusCode: res.statusCode, message: data }));
      }
    });
    req.on('error', reject);
    req.end();
  });
}

async function cleanupDuplicates() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🧹 Cleaning up duplicate products...\n');

  try {
    const products = await queryProducts(supabaseUrl, supabaseKey);
    console.log(`📦 Found ${products.length} total products\n`);

    // Group by slug
    const slugMap = new Map();
    products.forEach(product => {
      if (!slugMap.has(product.slug)) {
        slugMap.set(product.slug, []);
      }
      slugMap.get(product.slug).push(product);
    });

    let deletedCount = 0;
    let keptCount = 0;

    for (const [slug, items] of slugMap.entries()) {
      if (items.length > 1) {
        // Keep the first (oldest) one, delete the rest
        const [keep, ...duplicates] = items;
        keptCount++;
        
        for (const dup of duplicates) {
          try {
            await deleteProduct(dup.id, supabaseUrl, supabaseKey);
            console.log(`🗑️  Deleted duplicate: ${slug} (ID: ${dup.id})`);
            deletedCount++;
          } catch (error) {
            console.error(`❌ Failed to delete: ${slug} (ID: ${dup.id})`);
          }
        }
      } else {
        keptCount++;
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Kept: ${keptCount} products`);
    console.log(`   Deleted: ${deletedCount} duplicates\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
