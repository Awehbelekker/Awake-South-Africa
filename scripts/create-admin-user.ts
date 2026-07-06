/**
 * Create or update a tenant admin user in Supabase admin_users.
 *
 * Usage:
 *   npx tsx scripts/create-admin-user.ts
 *   npx tsx scripts/create-admin-user.ts --email admin@awakesa.co.za --password awake2026admin --tenant 904f8826-d36d-4075-afb7-d178048b6b20
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

require('dotenv').config({ path: '.env.local' })

const args = process.argv.slice(2)
function getArg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const email = getArg('email', 'admin@awakesa.co.za')
const password = getArg('password', 'awake2026admin')
const tenantId = getArg('tenant', '904f8826-d36d-4075-afb7-d178048b6b20')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey)
  const passwordHash = await bcrypt.hash(password, 12)

  const { data: existing } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash, tenant_id: tenantId, role: 'super_admin' })
      .eq('id', existing.id)

    if (error) {
      console.error('Failed to update admin user:', error.message)
      process.exit(1)
    }
    console.log(`Updated admin user: ${email}`)
  } else {
    const { error } = await supabase.from('admin_users').insert({
      email,
      password_hash: passwordHash,
      tenant_id: tenantId,
      role: 'super_admin',
    })

    if (error) {
      console.error('Failed to create admin user:', error.message)
      process.exit(1)
    }
    console.log(`Created admin user: ${email}`)
  }

  console.log('Done. You can log in at /admin with these credentials.')
}

main()
