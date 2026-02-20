/**
 * Verify current tenants table schema
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '..', '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking tenants table schema...\n');

// Query one tenant to see all columns
const url = new URL('/rest/v1/tenants', SUPABASE_URL);
url.searchParams.append('select', '*');
url.searchParams.append('limit', '1');

const options = {
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
};

https.get(url, options, (res) => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    if (res.statusCode === 200) {
      const tenants = JSON.parse(body);
      if (tenants.length > 0) {
        const columns = Object.keys(tenants[0]);
        console.log('✅ Current tenants table columns:\n');
        columns.forEach(col => console.log(`   - ${col}`));
        
        const googleDriveColumns = [
          'google_drive_enabled',
          'google_client_id', 
          'google_client_secret',
          'google_refresh_token',
          'google_drive_folder_id',
          'google_drive_last_sync',
          'subdomain'
        ];
        
        const missing = googleDriveColumns.filter(col => !columns.includes(col));
        
        if (missing.length > 0) {
          console.log('\n⚠️  Missing Google Drive columns:');
          missing.forEach(col => console.log(`   - ${col}`));
          console.log('\n📝 Run add-google-drive-to-tenants.sql in Supabase SQL Editor');
          console.log('   URL: https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/sql/new');
        } else {
          console.log('\n✅ All Google Drive columns exist!');
          console.log('   Ready to build OAuth endpoints');
        }
      }
    } else {
      console.error(`❌ Query failed: ${res.statusCode}`);
      console.error(body);
    }
  });
}).on('error', err => {
  console.error('❌ Request failed:', err.message);
});
