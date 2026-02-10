/**
 * Publish all draft products in Medusa
 */

const MEDUSA_URL = process.env.MEDUSA_URL || 'https://awake-south-africa-production.up.railway.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@awakesa.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'awake2026admin';

async function main() {
  console.log('🚀 Publishing all draft products...\n');
  
  // Auth
  const authRes = await fetch(`${MEDUSA_URL}/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const cookies = authRes.headers.get('set-cookie');
  
  if (authRes.status !== 200) {
    console.error('❌ Authentication failed');
    return;
  }
  console.log('✅ Authenticated\n');
  
  // Get all products
  const prodRes = await fetch(`${MEDUSA_URL}/admin/products?limit=100`, {
    headers: { 'Cookie': cookies }
  });
  const data = await prodRes.json();
  
  const draftProducts = data.products.filter(p => p.status === 'draft');
  console.log(`📦 Found ${draftProducts.length} draft products to publish\n`);
  
  let published = 0;
  let failed = 0;
  
  for (const product of draftProducts) {
    try {
      const updateRes = await fetch(`${MEDUSA_URL}/admin/products/${product.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({ status: 'published' })
      });
      
      if (updateRes.ok) {
        console.log(`✅ Published: ${product.title}`);
        published++;
      } else {
        const error = await updateRes.text();
        console.error(`❌ Failed to publish "${product.title}": ${error}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error publishing "${product.title}": ${err.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Published: ${published}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${draftProducts.length}`);
}

main().catch(console.error);

