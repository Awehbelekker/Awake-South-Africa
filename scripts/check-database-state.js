#!/usr/bin/env node
/**
 * Check Current Database State
 * Diagnose what tables exist and their structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking Database State...\n');

  // Check each table
  const tables = [
    'products', 'customers', 'addresses', 'orders', 'order_items',
    'cart', 'wishlist', 'reviews', 'payment_transactions', 'admin_users', 'inventory_log'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(0);
    
    if (error) {
      console.log(`❌ ${table}: NOT FOUND (${error.code})`);
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  }

  console.log('\n✅ Database check complete');
}

checkDatabase();
