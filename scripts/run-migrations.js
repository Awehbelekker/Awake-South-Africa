/**
 * Run all Supabase migrations in order.
 * Usage: node scripts/run-migrations.js
 * Requires: DATABASE_URL env var (Supabase direct connection string)
 *   Get it from: Supabase Dashboard → Settings → Database → Connection string → URI
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is not set.')
  console.error('   Get it from: Supabase Dashboard → Settings → Database → Connection string → URI')
  console.error('   Then run: DATABASE_URL="postgresql://postgres:[PASSWORD]@db.iepeffuszswxuwyqrzix.supabase.co:5432/postgres" node scripts/run-migrations.js\n')
  process.exit(1)
}

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('✓ Connected to Supabase\n')

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name text PRIMARY KEY,
        ran_at timestamptz DEFAULT now()
      )
    `)

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file])
      if (rows.length > 0) {
        console.log(`  ⏭  ${file} (already ran)`)
        continue
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      console.log(`  ▶  Running ${file}...`)
      try {
        await client.query(sql)
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
        console.log(`  ✓  ${file} done`)
      } catch (err) {
        console.error(`  ✗  ${file} FAILED: ${err.message}`)
        // Continue on non-fatal errors (e.g. already exists)
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          throw err
        }
        await client.query('INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT DO NOTHING', [file])
      }
    }

    console.log('\n✅ All migrations complete.\n')
  } finally {
    await client.end()
  }
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err.message)
  process.exit(1)
})
