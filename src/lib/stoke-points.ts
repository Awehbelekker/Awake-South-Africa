/**
 * Stoke Points — SA surf-culture loyalty system
 * Tiers: grom (0–499) → ripper (500–1499) → charger (1500–3999) → legend (4000+)
 */

import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export const TIERS = [
  { name: 'grom',    min: 0,    emoji: '🤙', label: 'Grom',    color: 'text-gray-500',   bg: 'bg-gray-100'   },
  { name: 'ripper',  min: 500,  emoji: '🌊', label: 'Ripper',  color: 'text-blue-600',   bg: 'bg-blue-100'   },
  { name: 'charger', min: 1500, emoji: '⚡', label: 'Charger', color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: 'legend',  min: 4000, emoji: '🏆', label: 'Legend',  color: 'text-yellow-600', bg: 'bg-yellow-100' },
]

export function getTier(points: number) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (points >= t.min) tier = t
  }
  return tier
}

export function pointsForNextTier(points: number): { next: typeof TIERS[0] | null; needed: number } {
  for (const t of TIERS) {
    if (points < t.min) return { next: t, needed: t.min - points }
  }
  return { next: null, needed: 0 }
}

export async function getBalance(tenantId: string, email: string) {
  const { data } = await sb()
    .from('stoke_points')
    .select('points, tier, total_earned')
    .eq('tenant_id', tenantId)
    .eq('customer_email', email)
    .single()
  return { points: data?.points || 0, tier: data?.tier || 'grom', total_earned: data?.total_earned || 0 }
}

export async function awardPoints(
  tenantId: string,
  email: string,
  points: number,
  reason: string,
  orderId?: string
): Promise<void> {
  const { data: existing } = await sb()
    .from('stoke_points')
    .select('id, points, total_earned')
    .eq('tenant_id', tenantId)
    .eq('customer_email', email)
    .single()

  const currentPoints = (existing?.points || 0) + points
  const currentEarned = (existing?.total_earned || 0) + Math.max(0, points)
  const tier = getTier(currentPoints).name

  await sb()
    .from('stoke_points')
    .upsert({
      tenant_id: tenantId,
      customer_email: email,
      points: currentPoints,
      tier,
      total_earned: currentEarned,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,customer_email' })

  await sb()
    .from('stoke_transactions')
    .insert({
      tenant_id: tenantId,
      customer_email: email,
      points,
      reason,
      order_id: orderId || null,
    })
}

export async function redeemPoints(
  tenantId: string,
  email: string,
  points: number
): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await sb()
    .from('stoke_points')
    .select('id, points')
    .eq('tenant_id', tenantId)
    .eq('customer_email', email)
    .single()

  if (!existing || existing.points < points) {
    return { success: false, error: 'Insufficient points' }
  }

  const newPoints = existing.points - points
  const tier = getTier(newPoints).name

  await sb()
    .from('stoke_points')
    .update({ points: newPoints, tier, updated_at: new Date().toISOString() })
    .eq('id', existing.id)

  await sb()
    .from('stoke_transactions')
    .insert({
      tenant_id: tenantId,
      customer_email: email,
      points: -points,
      reason: 'redeem',
    })

  return { success: true }
}

// 1 point per R10 spent
export function pointsForOrder(totalZar: number): number {
  return Math.floor(totalZar / 10)
}
