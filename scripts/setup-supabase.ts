/**
 * Supabase Setup Script
 * 
 * This script helps you set up Supabase for Awake Store
 * 
 * Usage: npx tsx scripts/setup-supabase.ts
 */

import * as readline from 'readline'
import * as fs from 'fs'
import * as path from 'path'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupSupabase() {
  console.log('\n🏄 Awake Store - Supabase Setup\n')
  console.log('=' .repeat(60))
  
  console.log('\n📋 Prerequisites:')
  console.log('1. Create a Supabase account at https://supabase.com')
  console.log('2. Create a new project')
  console.log('3. Wait for project to be ready (~2 minutes)')
  console.log('4. Have your credentials ready')
  
  console.log('\n' + '='.repeat(60))
  
  const proceed = await question('\nReady to configure? (y/n): ')
  if (proceed.toLowerCase() !== 'y') {
    console.log('Setup cancelled.')
    rl.close()
    return
  }
  
  console.log('\n📝 Enter your Supabase credentials:\n')
  
  const supabaseUrl = await question('Project URL (https://xxx.supabase.co): ')
  const supabaseAnonKey = await question('Anon/Public Key: ')
  const supabaseServiceKey = await question('Service Role Key (optional): ')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ URL and Anon Key are required!')
    rl.close()
    return
  }
  
  // Update .env.local
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')
  }
  
  // Remove old Supabase entries if they exist
  envContent = envContent.split('\n')
    .filter(line => !line.startsWith('NEXT_PUBLIC_SUPABASE_') && !line.startsWith('SUPABASE_SERVICE_KEY'))
    .join('\n')
  
  // Add new Supabase config
  const supabaseConfig = `
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
${supabaseServiceKey ? `SUPABASE_SERVICE_KEY=${supabaseServiceKey}` : ''}
`
  
  envContent += '\n' + supabaseConfig
  
  fs.writeFileSync(envPath, envContent.trim() + '\n')
  
  console.log('\n✅ Configuration saved to .env.local')
  
  // Create SQL migration file
  console.log('\n📋 Next steps:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Click "SQL Editor" in the left menu')
  console.log('3. Create a new query')
  console.log('4. Copy the contents of: supabase/schema.sql')
  console.log('5. Paste and run in SQL Editor')
  console.log('6. Run: npx tsx scripts/migrate-to-supabase.ts')
  
  console.log('\n🔗 Quick link:')
  console.log(supabaseUrl.replace('https://', 'https://app.') + '/project/_/sql')
  
  rl.close()
}

setupSupabase().catch(err => {
  console.error('\n❌ Setup failed:', err.message)
  rl.close()
  process.exit(1)
})
