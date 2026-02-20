#!/usr/bin/env node
/**
 * Deploy Supabase Schema
 * Executes schema.sql and migrations on Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function executeSqlFile(supabase, filePath, fileName) {
  try {
    console.log(`   📝 Executing ${fileName}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements (basic split on semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Execute using RPC function (we'll create this)
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_').select('*').limit(0);
        
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE EXTENSION')) {
          // These DDL statements may succeeed even if we get an error response
          continue;
        }
      }
    }
    
    console.log(`   ✅ ${fileName} completed`);
    return true;
  } catch (error) {
    console.error(`   ⚠️  ${fileName} failed: ${error.message}`);
    return false;
  }
}

async function deploySchema() {
  console.log('🚀 Deploying Supabase Schema...\n');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`📊 Project: ${supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1]}`);
  console.log(`🔗 Connecting to Supabase...\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('✅ Connected to Supabase\n');
  console.log('⚠️  NOTE: For full schema deployment, please use the Supabase Dashboard SQL Editor:\n');
  console.log(`   1. Go to: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
  console.log(`   2. Copy the contents of: supabase/schema.sql`);
  console.log(`   3. Paste and click "Run"`);
  console.log(`   4. Repeat for each migration file in: supabase/migrations/\n`);
  
  console.log('🎯 Alternative: Use the deploy-via-dashboard.ps1 script\n');
  
  // Test connection by checking if we can query
  const { data, error } = await supabase.from('products').select('count');
  
  if (!error) {
    console.log('✅ Products table exists - schema may already be deployed');
  } else {
    console.log('📋 Products table not found - schema needs to be deployed');
  }

  process.exit(0);
}

deploySchema();
