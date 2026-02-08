/**
 * Check product status in Medusa
 */

const MEDUSA_URL = process.env.MEDUSA_URL || 'https://awake-south-africa-production.up.railway.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@awakesa.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'awake2026admin';

async function main() {
  // Auth
  const authRes = await fetch(`${MEDUSA_URL}/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const cookies = authRes.headers.get('set-cookie');
  console.log('Auth status:', authRes.status);
  
  // Get products with full details
  const prodRes = await fetch(`${MEDUSA_URL}/admin/products?limit=100`, {
    headers: { 'Cookie': cookies }
  });
  const data = await prodRes.json();
  
  console.log('\n📊 Product Summary:');
  console.log(`Total products: ${data.count}`);
  
  // Check status distribution
  const statusCounts = {};
  const salesChannelCounts = { with: 0, without: 0 };
  
  for (const product of data.products) {
    statusCounts[product.status] = (statusCounts[product.status] || 0) + 1;
    if (product.sales_channels && product.sales_channels.length > 0) {
      salesChannelCounts.with++;
    } else {
      salesChannelCounts.without++;
    }
  }
  
  console.log('\nStatus distribution:');
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`);
  }
  
  console.log('\nSales channels:');
  console.log(`  With sales channel: ${salesChannelCounts.with}`);
  console.log(`  Without sales channel: ${salesChannelCounts.without}`);
  
  // Show first product details
  if (data.products.length > 0) {
    const p = data.products[0];
    console.log('\nFirst product details:');
    console.log(`  Title: ${p.title}`);
    console.log(`  Handle: ${p.handle}`);
    console.log(`  Status: ${p.status}`);
    console.log(`  Sales channels: ${JSON.stringify(p.sales_channels?.map(sc => sc.name) || [])}`);
  }
}

main().catch(console.error);

