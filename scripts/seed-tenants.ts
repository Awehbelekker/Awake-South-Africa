/**
 * Seed Initial Tenants
 * 
 * Creates the three initial tenants for the white-label platform:
 * 1. Awake SA (main store)
 * 2. Kelp Boards SA (first client)
 * 3. Aweh Be Lekker (second client)
 * 
 * Run with: npx ts-node scripts/seed-tenants.ts
 * Or: npx tsx scripts/seed-tenants.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================
// PAYMENT GATEWAY DEFINITIONS
// ============================================

const paymentGateways = [
  {
    code: 'payfast',
    name: 'PayFast',
    description: 'South African cards, EFT, and mobile payments',
    supported_currencies: ['ZAR'],
    is_active: true,
  },
  {
    code: 'yoco',
    name: 'Yoco',
    description: 'Simple card payments for SA small businesses',
    supported_currencies: ['ZAR'],
    is_active: true,
  },
  {
    code: 'peach',
    name: 'Peach Payments',
    description: 'Enterprise payment gateway with multi-currency support',
    supported_currencies: ['ZAR', 'USD', 'EUR', 'GBP'],
    is_active: true,
  },
  {
    code: 'ikhokha',
    name: 'iKhokha',
    description: 'Mobile-first SA payment solution',
    supported_currencies: ['ZAR'],
    is_active: true,
  },
  {
    code: 'stripe',
    name: 'Stripe',
    description: 'International payments with global reach',
    supported_currencies: ['ZAR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    is_active: true,
  },
]

// ============================================
// TENANT DEFINITIONS
// ============================================

const tenants = [
  {
    slug: 'awake-sa',
    name: 'Awake SA',
    email: 'info@awakesa.co.za',
    subdomain: 'awake',
    domain: 'www.awakesa.co.za',
    primary_color: '#3B82F6', // Blue
    secondary_color: '#1E40AF',
    accent_color: '#F59E0B',
    currency: 'ZAR',
    tax_rate: 15,
    timezone: 'Africa/Johannesburg',
    plan: 'enterprise' as const,
    is_active: true,
  },
  {
    slug: 'kelp-boards',
    name: 'Kelp Boards SA',
    email: 'info@kelpboards.co.za',
    subdomain: 'kelp',
    domain: 'www.kelpboards.co.za',
    primary_color: '#059669', // Green (ocean/kelp theme)
    secondary_color: '#047857',
    accent_color: '#0EA5E9',
    currency: 'ZAR',
    tax_rate: 15,
    timezone: 'Africa/Johannesburg',
    plan: 'pro' as const,
    is_active: true,
  },
  {
    slug: 'aweh-be-lekker',
    name: 'Aweh Be Lekker',
    email: 'info@awehbelekker.co.za',
    subdomain: 'aweh',
    domain: null, // Will use subdomain only for now
    primary_color: '#DC2626', // Red (vibrant SA theme)
    secondary_color: '#B91C1C',
    accent_color: '#FBBF24',
    currency: 'ZAR',
    tax_rate: 15,
    timezone: 'Africa/Johannesburg',
    plan: 'basic' as const,
    is_active: true,
  },
]

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedPaymentGateways() {
  console.log('🔧 Seeding payment gateways...')
  
  for (const gateway of paymentGateways) {
    const { error } = await supabase
      .from('payment_gateways')
      .upsert(gateway, { onConflict: 'code' })
    
    if (error) {
      console.error(`  ❌ Failed to seed ${gateway.name}:`, error.message)
    } else {
      console.log(`  ✅ ${gateway.name}`)
    }
  }
}

async function seedTenants() {
  console.log('\n🏪 Seeding tenants...')
  
  for (const tenant of tenants) {
    const { data, error } = await supabase
      .from('tenants')
      .upsert(tenant, { onConflict: 'slug' })
      .select()
      .single()
    
    if (error) {
      console.error(`  ❌ Failed to seed ${tenant.name}:`, error.message)
    } else {
      console.log(`  ✅ ${tenant.name} (${tenant.subdomain}.yoursaas.com)`)
    }
  }
}

async function main() {
  console.log('🚀 Starting tenant seed...\n')
  
  await seedPaymentGateways()
  await seedTenants()
  
  console.log('\n✨ Seed complete!')
  console.log('\nNext steps:')
  console.log('1. Add payment gateway credentials for each tenant in Master Admin')
  console.log('2. Configure Google Drive/OneDrive for each tenant')
  console.log('3. Upload logos and customize branding')
  console.log('4. Test each tenant\'s storefront')
}

main().catch(console.error)

