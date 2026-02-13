/**
 * Supabase Setup Verification Script
 * 
 * Verifies that Supabase is properly configured and all tables exist
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables')
  console.error('Please add to .env.local:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n')

  // Test 1: Connection
  console.log('1️⃣ Testing connection...')
  try {
    const { data, error } = await supabase.from('products').select('count').limit(1)
    if (error) throw error
    console.log('✅ Connection successful\n')
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message)
    console.error('\nPlease check:')
    console.error('  1. Supabase project is running')
    console.error('  2. Schema.sql has been executed')
    console.error('  3. Credentials in .env.local are correct')
    process.exit(1)
  }

  // Test 2: Check tables exist
  console.log('2️⃣ Checking tables...')
  const tables = [
    'products',
    'customers',
    'orders',
    'order_items',
    'cart',
    'wishlist',
    'reviews',
    'payment_transactions',
    'admin_users',
    'addresses',
    'inventory_log'
  ]
  
  let missingTables = 0
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) throw error
      console.log(`   ✅ ${table}`)
    } catch (err: any) {
      console.log(`   ❌ ${table} - ${err.message}`)
      missingTables++
    }
  }

  if (missingTables > 0) {
    console.error(`\n❌ ${missingTables} tables missing. Please run schema.sql in Supabase SQL Editor.`)
    process.exit(1)
  }

  // Test 3: Count products
  console.log('\n3️⃣ Counting products...')
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true })
  if (error) {
    console.error('❌ Error counting products:', error.message)
  } else {
    console.log(`   ✅ Found ${count || 0} products in database`)
  }

  console.log('\n🎉 Verification complete! Supabase is properly configured.')
}

verifySetup()
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message)
    process.exit(1)
  })
