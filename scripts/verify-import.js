#!/usr/bin/env node
/**
 * Verify Product Import
 * Check how many products exist in Supabase for the Awake tenant
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const AWAKE_TENANT_ID = '7f219734-0293-4dca-9c91-2f1a5aea78dd';

function queryProducts(supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?tenant_id=eq.${AWAKE_TENANT_ID}&select=id,slug,name,price,category`);
    
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject({ statusCode: res.statusCode, message: data });
        }
      });
    });

    req.on('error', (error) => {
      reject({ message: error.message });
    });

    req.end();
  });
}

async function verifyImport() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🔍 Verifying product import...\n');

  try {
    const products = await queryProducts(supabaseUrl, supabaseKey);
    
    console.log(`✅ Found ${products.length} products for Awake tenant\n`);
    
    // Group by category
    const byCategory = {};
    products.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });
    
    console.log('📊 Products by category:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    console.log('\n📝 Sample products:');
    products.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name} (R${p.price})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyImport();
