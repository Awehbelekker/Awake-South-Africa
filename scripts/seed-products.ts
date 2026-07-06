/**
 * Seed products from constants + official price list (AWAKE_PRICE_LIST_2025_COMPLETE.pdf)
 * Run: npx tsx scripts/seed-products.ts
 */

import 'dotenv/config'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { PRODUCTS } from '../src/lib/constants'
import { getProductInventory } from '../src/lib/inventory'
import { landedCostEur, resolvePrices } from '../src/lib/product-costs'

config({ path: '.env.local' })
config({ path: '.env.production.local' })
config({ path: '.env.vercel.tmp' })

function env(name: string, fallback?: string): string {
  const raw = process.env[name] ?? fallback ?? ''
  return raw.replace(/^["']|["']$/g, '')
}

const TENANT_ID = '904f8826-d36d-4075-afb7-d178048b6b20'
const URL = env('NEXT_PUBLIC_SUPABASE_URL', 'https://iepeffuszswxuwyqrzix.supabase.co')
const KEY = env('SUPABASE_SERVICE_ROLE_KEY')

if (!KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(URL, KEY)

async function main() {
  const rows: Record<string, unknown>[] = []

  for (const group of Object.values(PRODUCTS)) {
    for (const p of group) {
      const inv = getProductInventory(p.id)
      const official = resolvePrices(p.id)
      const landedZar = official?.landedExVatZar
      const costEur = landedZar ? landedCostEur(landedZar) : p.costEUR ?? null

      rows.push({
        tenant_id: TENANT_ID,
        name: p.name,
        slug: p.id,
        sku: p.id,
        description: p.description || '',
        price: official?.retailIncVatZar ?? p.price,
        price_ex_vat: official?.retailExVatZar ?? p.priceExVAT ?? Math.round(p.price / 1.15),
        cost_eur: costEur,
        category: p.category,
        category_tag: p.categoryTag || null,
        image: p.image || null,
        images: p.image ? [p.image] : [],
        badge: inv.badge ?? p.badge ?? null,
        battery: p.battery || null,
        skill_level: p.skillLevel || null,
        specs: p.specs || [],
        features: p.features || [],
        what_is_included: p.whatsIncluded || [],
        in_stock: inv.inStock,
        stock_quantity: inv.stockQuantity,
        is_active: true,
        is_featured: Boolean(p.badge || inv.badge),
        metadata: {
          localId: p.id,
          fulfillment: inv.fulfillment,
          leadTimeWeeks: inv.leadTimeWeeks,
          demoUnits: inv.demoUnits,
          landedExVatZar: landedZar,
        },
      })
    }
  }

  const { data, error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'tenant_id,slug' })
    .select('id, slug')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  const inStock = rows.filter((r) => r.in_stock && (r.stock_quantity as number) > 0)
  console.log(`Seeded ${data?.length || rows.length} products from official price list`)
  console.log(`In stock: ${inStock.map((r) => `${r.slug} x${r.stock_quantity}`).join(', ') || 'none'}`)
  console.log(`Pre-order (air freight): ${rows.length - inStock.length} items`)
}

main()
