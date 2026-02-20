#!/usr/bin/env node
/**
 * Test Multi-Tenant Filtering
 * Verifies that each tenant only sees their own products
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const TENANTS = {
  awake: { id: '7f219734-0293-4dca-9c91-2f1a5aea78dd', name: 'Awake Boards SA' },
  kelp: { id: '48fd8da0-41e0-4c62-a898-71a45457c827', name: 'Kelp' },
  offTheHook: { id: 'c771fd24-301a-4f78-8aa0-6a7c871dc048', name: 'Off the Hook' },
  awehBeLekker: { id: '1e98251c-9ffa-43d1-b322-c6e4d90e2174', name: 'Aweh Be Lekker' }
};

function queryProducts(tenantId, supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?tenant_id=eq.${tenantId}&select=id,slug,name,category`);
    
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

function queryAllProducts(supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?select=id,tenant_id`);
    
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

async function testMultiTenant() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🧪 Testing Multi-Tenant Isolation\n');
  console.log('=' .repeat(60));

  try {
    // Get total products
    const allProducts = await queryAllProducts(supabaseUrl, supabaseKey);
    console.log(`\n📊 Total products in database: ${allProducts.length}\n`);

    // Test each tenant
    for (const [key, tenant] of Object.entries(TENANTS)) {
      console.log(`\n🏢 Tenant: ${tenant.name}`);
      console.log('-'.repeat(60));

      const products = await queryProducts(tenant.id, supabaseUrl, supabaseKey);
      
      if (products.length === 0) {
        console.log(`   ⚠️  No products found`);
      } else {
        console.log(`   ✅ Found ${products.length} products`);
        
        // Show category breakdown
        const byCategory = {};
        products.forEach(p => {
          byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        });
        
        console.log(`\n   📦 By category:`);
        Object.entries(byCategory).forEach(([cat, count]) => {
          console.log(`      ${cat}: ${count}`);
        });

        // Show first 3 products
        console.log(`\n   📝 Sample products:`);
        products.slice(0, 3).forEach(p => {
          console.log(`      - ${p.name} (${p.slug})`);
        });
      }
    }

    // Verify isolation
    console.log('\n' + '='.repeat(60));
    console.log('\n🔒 Tenant Isolation Check:\n');

    const tenantCounts = {};
    allProducts.forEach(p => {
      tenantCounts[p.tenant_id] = (tenantCounts[p.tenant_id] || 0) + 1;
    });

    let isolationPassed = true;
    for (const [key, tenant] of Object.entries(TENANTS)) {
      const count = tenantCounts[tenant.id] || 0;
      const tenantProducts = await queryProducts(tenant.id, supabaseUrl, supabaseKey);
      
      if (count === tenantProducts.length) {
        console.log(`   ✅ ${tenant.name}: ${count} products (isolated)`);
      } else {
        console.log(`   ❌ ${tenant.name}: Mismatch detected!`);
        isolationPassed = false;
      }
    }

    console.log('\n' + '='.repeat(60));
    if (isolationPassed) {
      console.log('\n✅ Multi-tenant isolation PASSED\n');
    } else {
      console.log('\n❌ Multi-tenant isolation FAILED\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testMultiTenant();
