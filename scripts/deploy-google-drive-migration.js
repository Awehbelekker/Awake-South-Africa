/**
 * Deploy Google Drive OAuth columns to tenants table
 * Adds: google_drive_enabled, google_client_id, google_client_secret, 
 *       google_refresh_token, google_drive_folder_id, google_drive_last_sync, subdomain
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env.local for Supabase credentials
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
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Read SQL file
const sqlPath = path.join(__dirname, '..', 'supabase', 'add-google-drive-to-tenants.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Clean SQL (remove comments and empty lines)
const cleanedSql = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--') && line.trim())
  .join('\n');

console.log('🚀 Deploying Google Drive migration to Supabase...\n');

// Execute SQL via Supabase REST API using postgres RPC
const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
const data = JSON.stringify({ query: cleanedSql });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
  }
};

const req = https.request(url, options, (res) => {
  let body = '';
  
  res.on('data', chunk => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Google Drive migration deployed successfully!\n');
      console.log('Added columns:');
      console.log('  - google_drive_enabled (BOOLEAN)');
      console.log('  - google_client_id (TEXT)');
      console.log('  - google_client_secret (TEXT)');
      console.log('  - google_refresh_token (TEXT)');
      console.log('  - google_drive_folder_id (TEXT)');
      console.log('  - google_drive_last_sync (TIMESTAMPTZ)');
      console.log('  - subdomain (VARCHAR UNIQUE)\n');
      console.log('Updated tenant subdomains:');
      console.log('  - awake → awake');
      console.log('  - kelp → kelp');
      console.log('  - off-the-hook → offthehook');
      console.log('  - aweh-be-lekker → aweh');
    } else {
      console.error(`❌ Deployment failed with status ${res.statusCode}`);
      console.error('Response:', body);
      
      // Try direct SQL execution instead
      console.log('\n⚠️ RPC method failed, trying direct execution...\n');
      executeSqlDirectly(cleanedSql);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n⚠️ Trying alternative method...\n');
  executeSqlDirectly(cleanedSql);
});

req.write(data);
req.end();

// Alternative method: Execute each statement individually
function executeSqlDirectly(sql) {
  console.log('📝 Please run this SQL manually in Supabase SQL Editor:\n');
  console.log('1. Go to https://supabase.com/dashboard/project/iepeffuszswxuwyqrzix/sql/new');
  console.log('2. Copy and paste the following SQL:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n3. Click "Run" to execute');
  console.log('\n✨ After running, your tenants table will have Google Drive OAuth support!');
}
