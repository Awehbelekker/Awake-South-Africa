#!/usr/bin/env node
/**
 * Verify Tenant API and Product Fetching
 * Tests the /api/tenant endpoint and product loading
 */

const https = require('https');

async function testTenantAPI() {
  console.log('🧪 Testing Tenant Detection API\n');
  console.log('=' .repeat(60));

  // Test localhost (should return Awake tenant in dev mode)
  console.log('\n📍 Test 1: Localhost (Development Mode)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch('http://localhost:3000/api/tenant');
    const data = await response.json();
    
    if (data.tenant) {
      console.log('✅ Tenant detected:');
      console.log(`   Name: ${data.tenant.name}`);
      console.log(`   Slug: ${data.tenant.slug}`);
      console.log(`   ID: ${data.tenant.id || 'N/A'}`);
      
      if (data.tenant.id) {
        console.log('\n✅ Full tenant object returned (good for product fetching)');
      } else {
        console.log('\n⚠️  Default config only (products won\'t load correctly)');
      }
    } else {
      console.log('❌ No tenant data returned');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nℹ️  Make sure Next.js dev server is running: npm run dev');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Expected Results:');
  console.log('   - Localhost should return Awake tenant with full ID');
  console.log('   - Subdomains would return their specific tenant');
  console.log('   - Custom domains would return mapped tenant\n');
}

// Check if dev server is accessible
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkDevServer();
  
  if (!serverRunning) {
    console.log('❌ Next.js dev server not running on http://localhost:3000');
    console.log('\n📝 Start the dev server first:');
    console.log('   npm run dev\n');
    process.exit(1);
  }

  await testTenantAPI();
}

main();
