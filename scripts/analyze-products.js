#!/usr/bin/env node
/**
 * Detailed product analysis
 */

const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const AWAKE_TENANT_ID = '7f219734-0293-4dca-9c91-2f1a5aea78dd';

function queryProducts(supabaseUrl, supabaseKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${supabaseUrl}/rest/v1/products?tenant_id=eq.${AWAKE_TENANT_ID}&select=id,slug,name,category,created_at`);
    
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

async function analyzeProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  console.log('🔍 Analyzing products...\n');

  try {
    const products = await queryProducts(supabaseUrl, supabaseKey);
    console.log(`📦 Total: ${products.length} products\n`);

    // Check for duplicate slugs
    const slugCounts = new Map();
    products.forEach(p => {
      slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
    });

    const duplicateSlugs = Array.from(slugCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicateSlugs.length > 0) {
      console.log('⚠️  Duplicate slugs found:');
      duplicateSlugs.forEach(([slug, count]) => {
        console.log(`   ${slug}: ${count} entries`);
      });
      console.log();
    } else {
      console.log('✅ No duplicate slugs\n');
    }

    // Show category breakdown
    const byCategory = {};
    products.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });

    console.log('📊 By category:');
    Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    console.log(`\n📝 First 10 products:`);
    products.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. [${p.category}] ${p.name} (${p.slug})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeProducts();
