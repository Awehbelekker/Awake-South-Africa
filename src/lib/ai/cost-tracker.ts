/**
 * AI Cost Tracking System
 * 
 * Tracks AI usage and costs per tenant to monitor spending
 */

import { createClient } from '@supabase/supabase-js'
import type { AIUsageRecord, AIOperation, AIUsageStats } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Track AI usage
 */
export async function trackAIUsage(params: {
  tenantId: string
  operation: AIOperation
  provider: string
  tokensUsed: number
  cost: number
  metadata?: Record<string, any>
}): Promise<void> {
  try {
    const { error } = await supabase.from('ai_usage').insert({
      tenant_id: params.tenantId,
      operation: params.operation,
      provider: params.provider,
      tokens_used: params.tokensUsed,
      cost: params.cost,
      metadata: params.metadata,
      timestamp: new Date().toISOString(),
    })
    
    if (error) {
      console.error('Failed to track AI usage:', error)
    }
  } catch (err) {
    console.error('Error tracking AI usage:', err)
  }
}

/**
 * Get AI usage stats for a tenant
 */
export async function getAIUsageStats(
  tenantId: string,
  period?: { start: Date; end: Date }
): Promise<AIUsageStats> {
  const start = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
  const end = period?.end || new Date()
  
  const { data, error } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('timestamp', start.toISOString())
    .lte('timestamp', end.toISOString())
  
  if (error) {
    console.error('Failed to get AI usage stats:', error)
    return {
      totalOperations: 0,
      totalTokens: 0,
      totalCost: 0,
      operationBreakdown: {} as any,
      period: { start, end },
    }
  }
  
  const records = data as AIUsageRecord[]
  
  // Calculate totals
  const totalOperations = records.length
  const totalTokens = records.reduce((sum, r) => sum + r.tokensUsed, 0)
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0)
  
  // Calculate breakdown by operation
  const operationBreakdown: Record<AIOperation, { count: number; tokens: number; cost: number }> = {
    product_analysis: { count: 0, tokens: 0, cost: 0 },
    description_generation: { count: 0, tokens: 0, cost: 0 },
    seo_generation: { count: 0, tokens: 0, cost: 0 },
    image_alt_generation: { count: 0, tokens: 0, cost: 0 },
    batch_analysis: { count: 0, tokens: 0, cost: 0 },
  }
  
  records.forEach(record => {
    const op = record.operation
    operationBreakdown[op].count++
    operationBreakdown[op].tokens += record.tokensUsed
    operationBreakdown[op].cost += record.cost
  })
  
  return {
    totalOperations,
    totalTokens,
    totalCost,
    operationBreakdown,
    period: { start, end },
  }
}

/**
 * Check if tenant should switch to self-hosted AI
 * Returns true if monthly costs exceed R5,000
 */
export async function shouldSwitchToSelfHosted(tenantId: string): Promise<boolean> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const stats = await getAIUsageStats(tenantId, { start: thirtyDaysAgo, end: new Date() })
  
  return stats.totalCost > 5000
}

/**
 * Get cost projection for next month
 */
export async function getCostProjection(tenantId: string): Promise<number> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const stats = await getAIUsageStats(tenantId, { start: sevenDaysAgo, end: new Date() })
  
  // Project weekly cost to monthly
  const weeklyAverage = stats.totalCost
  const monthlyProjection = weeklyAverage * 4.33 // Average weeks per month
  
  return Math.round(monthlyProjection * 100) / 100
}

/**
 * Get all tenants' AI usage summary
 */
export async function getAllTenantsUsage(): Promise<Array<{
  tenantId: string
  tenantName: string
  totalCost: number
  totalOperations: number
  projection: number
}>> {
  const { data: tenants } = await supabase.from('tenants').select('id, name')
  
  if (!tenants) return []
  
  const results = await Promise.all(
    tenants.map(async tenant => {
      const stats = await getAIUsageStats(tenant.id)
      const projection = await getCostProjection(tenant.id)
      
      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        totalCost: stats.totalCost,
        totalOperations: stats.totalOperations,
        projection,
      }
    })
  )
  
  return results.sort((a, b) => b.totalCost - a.totalCost)
}

