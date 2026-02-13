/**
 * Price Comparison Agent
 * 
 * Compares supplier prices against market data to recommend optimal retail pricing.
 * 
 * Features:
 * - Competitor price lookup (Takealot, Superbalist, Bash, etc.)
 * - Market average calculation
 * - Margin optimization (cost vs market vs recommended)
 * - Price alerts when supplier costs exceed market norms
 * - Seasonal demand adjustment
 * - Bulk comparison for entire pricelists
 * - Approval workflow: NEVER auto-changes prices, requires user review & approval
 */

import { createClient } from '@/lib/supabase/client'

// ============================================================================
// Types
// ============================================================================

export interface CompetitorPrice {
  source: string        // e.g., "Takealot", "Superbalist", "Bash"
  productName: string
  price: number         // ZAR
  url?: string
  lastChecked: Date
  inStock: boolean
}

export interface PriceAnalysis {
  productSku: string
  productName: string
  supplierCost: number
  currentRetailPrice?: number
  competitorPrices: CompetitorPrice[]
  marketAverage: number
  marketLow: number
  marketHigh: number
  recommendedPrice: number
  recommendedMargin: number       // percentage
  pricePosition: 'below_market' | 'at_market' | 'above_market'
  confidence: number              // 0-1
  alerts: PriceAlert[]
  reasoning: string
}

export interface PriceAlert {
  type: 'supplier_too_high' | 'margin_too_low' | 'competitor_undercut' | 'price_drop' | 'demand_spike' | 'seasonal'
  severity: 'info' | 'warning' | 'critical'
  message: string
  data?: Record<string, any>
}

/** Price change request — requires explicit user approval */
export interface PriceChangeRequest {
  id?: string
  tenantId: string
  productSku: string
  productName: string
  currentPrice: number
  recommendedPrice: number
  reason: string
  analysis: PriceAnalysis
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  requestedAt: string
  requestedBy: 'price_agent'  // always the agent
  reviewedBy?: string         // userId who approved/rejected
  reviewedAt?: string
  appliedAt?: string
}

export interface PriceComparisonOptions {
  /** Target margin percentage (default: 40%) */
  targetMargin?: number
  /** Minimum acceptable margin (default: 15%) */
  minMargin?: number
  /** Maximum acceptable margin (default: 70%) */
  maxMargin?: number
  /** Include seasonal adjustments */
  seasonalAdjust?: boolean
  /** Competitor sources to check */
  sources?: string[]
  /** Category for better matching */
  category?: string
}

export interface BatchPriceResult {
  total: number
  analyzed: number
  alerts: number
  criticalAlerts: number
  results: PriceAnalysis[]
  summary: PriceSummary
}

export interface PriceSummary {
  avgMargin: number
  belowMarket: number
  atMarket: number
  aboveMarket: number
  avgConfidence: number
  totalPotentialRevenue: number
  optimizedRevenue: number
  revenueDifference: number
}

// ============================================================================
// South African Competitor Sources
// ============================================================================

const SA_COMPETITORS = [
  { name: 'Takealot', domain: 'takealot.com', category: 'general' },
  { name: 'Superbalist', domain: 'superbalist.com', category: 'fashion' },
  { name: 'Bash', domain: 'bash.com', category: 'fashion' },
  { name: 'Zando', domain: 'zando.co.za', category: 'fashion' },
  { name: 'Makro', domain: 'makro.co.za', category: 'general' },
  { name: 'Game', domain: 'game.co.za', category: 'general' },
  { name: 'Mr Price', domain: 'mrp.com', category: 'fashion' },
  { name: 'Cape Union Mart', domain: 'capeunionmart.co.za', category: 'outdoor' },
  { name: 'Sportsmans Warehouse', domain: 'sportsmans.co.za', category: 'sport' },
]

// Seasonal multipliers for South Africa
const SEASONAL_MULTIPLIERS: Record<string, Record<number, number>> = {
  'outdoor': { 1: 0.85, 2: 0.85, 3: 0.9, 4: 0.95, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0, 9: 1.05, 10: 1.1, 11: 1.15, 12: 1.2 },
  'fashion': { 1: 1.1, 2: 0.9, 3: 0.95, 4: 1.0, 5: 1.0, 6: 0.95, 7: 0.9, 8: 0.95, 9: 1.0, 10: 1.05, 11: 1.15, 12: 1.2 },
  'sport':   { 1: 1.1, 2: 1.05, 3: 1.0, 4: 0.95, 5: 0.9, 6: 0.85, 7: 0.85, 8: 0.9, 9: 1.0, 10: 1.05, 11: 1.1, 12: 1.15 },
  'general': { 1: 0.95, 2: 0.95, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0, 11: 1.1, 12: 1.15 },
}

// ============================================================================
// Core Price Comparison Logic
// ============================================================================

/**
 * Analyze a single product's price against the market
 */
export async function analyzeProductPrice(
  sku: string,
  productName: string,
  supplierCost: number,
  currentRetailPrice?: number,
  options: PriceComparisonOptions = {}
): Promise<PriceAnalysis> {
  const {
    targetMargin = 40,
    minMargin = 15,
    maxMargin = 70,
    seasonalAdjust = true,
    sources = SA_COMPETITORS.map(c => c.name),
    category = 'general',
  } = options

  // Step 1: Get competitor prices
  const competitorPrices = await fetchCompetitorPrices(productName, sku, sources)

  // Step 2: Calculate market metrics
  const validPrices = competitorPrices.filter(cp => cp.price > 0 && cp.inStock)
  const priceValues = validPrices.map(cp => cp.price)

  let marketAverage = 0
  let marketLow = 0
  let marketHigh = 0

  if (priceValues.length > 0) {
    marketAverage = priceValues.reduce((a, b) => a + b, 0) / priceValues.length
    marketLow = Math.min(...priceValues)
    marketHigh = Math.max(...priceValues)
  } else {
    // No competitor data — estimate from cost + standard margins
    marketAverage = supplierCost * 2.2    // Typical SA retail ~120% markup
    marketLow = supplierCost * 1.6
    marketHigh = supplierCost * 3.0
  }

  // Step 3: Apply seasonal adjustment
  let seasonalMultiplier = 1.0
  if (seasonalAdjust) {
    const month = new Date().getMonth() + 1
    const categoryMultipliers = SEASONAL_MULTIPLIERS[category] || SEASONAL_MULTIPLIERS['general']
    seasonalMultiplier = categoryMultipliers[month] || 1.0
  }

  const adjustedMarketAvg = marketAverage * seasonalMultiplier

  // Step 4: Calculate recommended price
  const costBasedPrice = supplierCost * (1 + targetMargin / 100)
  const marketBasedPrice = adjustedMarketAvg * 0.97 // Slightly below market average
  
  // Weighted recommendation: 40% cost-based, 60% market-based (if we have market data)
  let recommendedPrice: number
  if (priceValues.length >= 2) {
    recommendedPrice = costBasedPrice * 0.4 + marketBasedPrice * 0.6
  } else if (priceValues.length === 1) {
    recommendedPrice = costBasedPrice * 0.6 + marketBasedPrice * 0.4
  } else {
    recommendedPrice = costBasedPrice
  }

  // Ensure minimum margin
  const minPrice = supplierCost * (1 + minMargin / 100)
  const maxPrice = supplierCost * (1 + maxMargin / 100)
  recommendedPrice = Math.max(minPrice, Math.min(maxPrice, recommendedPrice))

  // Round to nearest R5 for clean pricing (SA convention)
  recommendedPrice = Math.ceil(recommendedPrice / 5) * 5 - 1 // e.g., R499, R299

  const recommendedMargin = ((recommendedPrice - supplierCost) / supplierCost) * 100

  // Step 5: Determine market position
  let pricePosition: PriceAnalysis['pricePosition']
  if (recommendedPrice < adjustedMarketAvg * 0.9) {
    pricePosition = 'below_market'
  } else if (recommendedPrice > adjustedMarketAvg * 1.1) {
    pricePosition = 'above_market'
  } else {
    pricePosition = 'at_market'
  }

  // Step 6: Generate alerts
  const alerts = generatePriceAlerts(
    supplierCost,
    currentRetailPrice,
    recommendedPrice,
    marketAverage,
    marketLow,
    competitorPrices,
    minMargin,
    category,
    seasonalMultiplier
  )

  // Step 7: Confidence score
  const confidence = calculateConfidence(priceValues.length, competitorPrices.length)

  // Step 8: Generate reasoning
  const reasoning = generateReasoning(
    supplierCost,
    recommendedPrice,
    marketAverage,
    priceValues.length,
    seasonalMultiplier,
    pricePosition,
    recommendedMargin
  )

  return {
    productSku: sku,
    productName,
    supplierCost,
    currentRetailPrice,
    competitorPrices,
    marketAverage: Math.round(marketAverage * 100) / 100,
    marketLow: Math.round(marketLow * 100) / 100,
    marketHigh: Math.round(marketHigh * 100) / 100,
    recommendedPrice,
    recommendedMargin: Math.round(recommendedMargin * 10) / 10,
    pricePosition,
    confidence,
    alerts,
    reasoning,
  }
}

/**
 * Batch analyze prices for an entire pricelist
 */
export async function batchAnalyzePrices(
  tenantId: string,
  pricelistId?: string,
  options: PriceComparisonOptions = {}
): Promise<BatchPriceResult> {
  const supabase: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch products or pricelist items
  let query = supabase
    .from('products')
    .select('id, sku, name, price, cost_price, category, metadata')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (pricelistId) {
    // If pricelist specified, get items from pricelist instead
    const { data: items, error } = await supabase
      .from('supplier_pricelist_items')
      .select('*')
      .eq('pricelist_id', pricelistId)
      .eq('tenant_id', tenantId)

    if (error || !items || items.length === 0) {
      return {
        total: 0, analyzed: 0, alerts: 0, criticalAlerts: 0,
        results: [],
        summary: emptySummary(),
      }
    }

    const results: PriceAnalysis[] = []
    for (const item of items) {
      const analysis = await analyzeProductPrice(
        item.sku,
        item.description || item.sku,
        item.unit_price || 0,
        undefined,
        { ...options, category: item.category || options.category }
      )
      results.push(analysis)
    }

    return buildBatchResult(results)
  }

  const { data: products, error } = await query

  if (error || !products || products.length === 0) {
    return {
      total: 0, analyzed: 0, alerts: 0, criticalAlerts: 0,
      results: [],
      summary: emptySummary(),
    }
  }

  const results: PriceAnalysis[] = []
  for (const product of products) {
    const analysis = await analyzeProductPrice(
      product.sku,
      product.name,
      product.cost_price || 0,
      product.price,
      { ...options, category: product.category || options.category }
    )
    results.push(analysis)
  }

  return buildBatchResult(results)
}

/**
 * Store price analysis results in database for tracking
 */
export async function savePriceAnalysis(
  tenantId: string,
  analysis: PriceAnalysis
): Promise<void> {
  const supabase: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase
    .from('price_analyses')
    .insert({
      tenant_id: tenantId,
      product_sku: analysis.productSku,
      product_name: analysis.productName,
      supplier_cost: analysis.supplierCost,
      current_retail_price: analysis.currentRetailPrice,
      market_average: analysis.marketAverage,
      market_low: analysis.marketLow,
      market_high: analysis.marketHigh,
      recommended_price: analysis.recommendedPrice,
      recommended_margin: analysis.recommendedMargin,
      price_position: analysis.pricePosition,
      confidence: analysis.confidence,
      competitor_count: analysis.competitorPrices.length,
      alerts: analysis.alerts,
      reasoning: analysis.reasoning,
      analyzed_at: new Date().toISOString(),
    })
}

/**
 * Get price history for a product to track trends
 */
export async function getPriceHistory(
  tenantId: string,
  productSku: string,
  days: number = 90
): Promise<Array<{
  date: string
  supplierCost: number
  marketAverage: number
  recommendedPrice: number
  retailPrice?: number
}>> {
  const supabase: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('price_analyses')
    .select('analyzed_at, supplier_cost, market_average, recommended_price, current_retail_price')
    .eq('tenant_id', tenantId)
    .eq('product_sku', productSku)
    .gte('analyzed_at', since.toISOString())
    .order('analyzed_at', { ascending: true })

  if (error || !data) return []

  return data.map((row: any) => ({
    date: row.analyzed_at,
    supplierCost: row.supplier_cost,
    marketAverage: row.market_average,
    recommendedPrice: row.recommended_price,
    retailPrice: row.current_retail_price,
  }))
}

// ============================================================================
// Competitor Price Fetching
// ============================================================================

/**
 * Fetch competitor prices for a product
 * 
 * NOTE: In production, this would use web scraping APIs (e.g., SerpAPI, ScraperAPI)
 * or dedicated price monitoring services (e.g., Prisync, Competera).
 * For now, uses intelligent estimation based on product category and cost.
 * 
 * To activate real scraping, set PRICE_SCRAPING_API_KEY in .env.local
 * and uncomment the real implementation below.
 */
async function fetchCompetitorPrices(
  productName: string,
  sku: string,
  sources: string[]
): Promise<CompetitorPrice[]> {
  const apiKey = process.env.PRICE_SCRAPING_API_KEY

  if (apiKey) {
    return fetchRealCompetitorPrices(productName, sku, sources, apiKey)
  }

  // Return empty — the agent will use cost-based estimation
  // This is honest: we don't fake competitor data
  return []
}

/**
 * Real competitor price fetching via scraping API
 * Activate by setting PRICE_SCRAPING_API_KEY
 */
async function fetchRealCompetitorPrices(
  productName: string,
  sku: string,
  sources: string[],
  apiKey: string
): Promise<CompetitorPrice[]> {
  const results: CompetitorPrice[] = []

  // Search each competitor site
  for (const sourceName of sources) {
    const competitor = SA_COMPETITORS.find(c => c.name === sourceName)
    if (!competitor) continue

    try {
      // Use SerpAPI Google Shopping or similar
      const searchQuery = encodeURIComponent(`${productName} site:${competitor.domain}`)
      const response = await fetch(
        `https://serpapi.com/search.json?q=${searchQuery}&tbm=shop&gl=za&hl=en&api_key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      )

      if (!response.ok) continue

      const data = await response.json()

      // Extract shopping results
      if (data.shopping_results && data.shopping_results.length > 0) {
        const topResult = data.shopping_results[0]
        const price = parseFloat(
          String(topResult.price || '0').replace(/[^0-9.]/g, '')
        )

        if (price > 0) {
          results.push({
            source: competitor.name,
            productName: topResult.title || productName,
            price,
            url: topResult.link,
            lastChecked: new Date(),
            inStock: !topResult.out_of_stock,
          })
        }
      }
    } catch {
      // Skip failed sources silently
      continue
    }
  }

  return results
}

// ============================================================================
// Alert Generation
// ============================================================================

function generatePriceAlerts(
  supplierCost: number,
  currentRetailPrice: number | undefined,
  recommendedPrice: number,
  marketAverage: number,
  marketLow: number,
  competitorPrices: CompetitorPrice[],
  minMargin: number,
  category: string,
  seasonalMultiplier: number
): PriceAlert[] {
  const alerts: PriceAlert[] = []

  // Alert: Supplier cost too high relative to market
  if (marketAverage > 0 && supplierCost > marketAverage * 0.7) {
    alerts.push({
      type: 'supplier_too_high',
      severity: supplierCost > marketAverage * 0.85 ? 'critical' : 'warning',
      message: `Supplier cost (R${supplierCost.toFixed(2)}) is ${((supplierCost / marketAverage) * 100).toFixed(0)}% of market average (R${marketAverage.toFixed(2)}). Negotiate better rates or find alternate suppliers.`,
      data: { supplierCost, marketAverage, ratio: supplierCost / marketAverage },
    })
  }

  // Alert: Current price margin too low
  if (currentRetailPrice) {
    const currentMargin = ((currentRetailPrice - supplierCost) / supplierCost) * 100
    if (currentMargin < minMargin) {
      alerts.push({
        type: 'margin_too_low',
        severity: currentMargin < 5 ? 'critical' : 'warning',
        message: `Current margin of ${currentMargin.toFixed(1)}% is below minimum ${minMargin}%. Recommended price: R${recommendedPrice.toFixed(2)}`,
        data: { currentMargin, minMargin, currentPrice: currentRetailPrice, recommendedPrice },
      })
    }
  }

  // Alert: Competitor significantly undercuts
  const cheapestCompetitor = competitorPrices
    .filter(cp => cp.inStock && cp.price > 0)
    .sort((a, b) => a.price - b.price)[0]

  if (cheapestCompetitor && currentRetailPrice && cheapestCompetitor.price < currentRetailPrice * 0.85) {
    alerts.push({
      type: 'competitor_undercut',
      severity: 'warning',
      message: `${cheapestCompetitor.source} sells at R${cheapestCompetitor.price.toFixed(2)} — ${((1 - cheapestCompetitor.price / currentRetailPrice) * 100).toFixed(0)}% below your price.`,
      data: { competitor: cheapestCompetitor.source, competitorPrice: cheapestCompetitor.price, yourPrice: currentRetailPrice },
    })
  }

  // Alert: Price significantly different from recommended
  if (currentRetailPrice && Math.abs(currentRetailPrice - recommendedPrice) > recommendedPrice * 0.15) {
    const direction = currentRetailPrice > recommendedPrice ? 'above' : 'below'
    alerts.push({
      type: 'price_drop',
      severity: 'info',
      message: `Current price (R${currentRetailPrice.toFixed(2)}) is ${direction} recommended (R${recommendedPrice.toFixed(2)}). Consider adjusting.`,
      data: { currentPrice: currentRetailPrice, recommendedPrice, direction },
    })
  }

  // Alert: Seasonal opportunity
  if (seasonalMultiplier > 1.05) {
    alerts.push({
      type: 'seasonal',
      severity: 'info',
      message: `Seasonal demand is ${((seasonalMultiplier - 1) * 100).toFixed(0)}% above average for ${category}. Good time to hold or increase prices.`,
      data: { seasonalMultiplier, category },
    })
  } else if (seasonalMultiplier < 0.95) {
    alerts.push({
      type: 'seasonal',
      severity: 'info',
      message: `Seasonal demand is ${((1 - seasonalMultiplier) * 100).toFixed(0)}% below average for ${category}. Consider promotional pricing.`,
      data: { seasonalMultiplier, category },
    })
  }

  return alerts
}

// ============================================================================
// Helpers
// ============================================================================

function calculateConfidence(validPriceCount: number, totalSourceCount: number): number {
  if (validPriceCount >= 5) return 0.95
  if (validPriceCount >= 3) return 0.85
  if (validPriceCount >= 2) return 0.7
  if (validPriceCount >= 1) return 0.5
  return 0.3 // Cost-based estimation only
}

function generateReasoning(
  supplierCost: number,
  recommendedPrice: number,
  marketAverage: number,
  competitorCount: number,
  seasonalMultiplier: number,
  pricePosition: string,
  margin: number
): string {
  const parts: string[] = []

  if (competitorCount > 0) {
    parts.push(`Based on ${competitorCount} competitor price${competitorCount > 1 ? 's' : ''}, market average is R${marketAverage.toFixed(2)}.`)
  } else {
    parts.push(`No competitor data available — using cost-based pricing model.`)
  }

  parts.push(`Supplier cost: R${supplierCost.toFixed(2)}.`)
  parts.push(`Recommended: R${recommendedPrice.toFixed(2)} (${margin.toFixed(1)}% margin).`)

  if (pricePosition === 'below_market') {
    parts.push(`This positions you below market average — competitive pricing to gain market share.`)
  } else if (pricePosition === 'above_market') {
    parts.push(`This positions you above market average — ensure perceived value justifies the premium.`)
  } else {
    parts.push(`This positions you at market average — balanced between competitiveness and margin.`)
  }

  if (seasonalMultiplier !== 1.0) {
    const pct = ((seasonalMultiplier - 1) * 100).toFixed(0)
    parts.push(`Seasonal adjustment: ${seasonalMultiplier > 1 ? '+' : ''}${pct}%.`)
  }

  return parts.join(' ')
}

function buildBatchResult(results: PriceAnalysis[]): BatchPriceResult {
  const allAlerts = results.flatMap(r => r.alerts)
  const criticalAlerts = allAlerts.filter(a => a.severity === 'critical')

  const margins = results.filter(r => r.recommendedMargin > 0).map(r => r.recommendedMargin)
  const avgMargin = margins.length > 0 ? margins.reduce((a, b) => a + b, 0) / margins.length : 0

  const belowMarket = results.filter(r => r.pricePosition === 'below_market').length
  const atMarket = results.filter(r => r.pricePosition === 'at_market').length
  const aboveMarket = results.filter(r => r.pricePosition === 'above_market').length

  const confidences = results.map(r => r.confidence)
  const avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0

  const totalPotentialRevenue = results.reduce((sum, r) => sum + (r.currentRetailPrice || 0), 0)
  const optimizedRevenue = results.reduce((sum, r) => sum + r.recommendedPrice, 0)

  return {
    total: results.length,
    analyzed: results.length,
    alerts: allAlerts.length,
    criticalAlerts: criticalAlerts.length,
    results,
    summary: {
      avgMargin: Math.round(avgMargin * 10) / 10,
      belowMarket,
      atMarket,
      aboveMarket,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      totalPotentialRevenue: Math.round(totalPotentialRevenue * 100) / 100,
      optimizedRevenue: Math.round(optimizedRevenue * 100) / 100,
      revenueDifference: Math.round((optimizedRevenue - totalPotentialRevenue) * 100) / 100,
    },
  }
}

// ============================================================================
// Approval Workflow — Prices NEVER change without user consent
// ============================================================================

/**
 * Create a price change request for user approval.
 * The agent RECOMMENDS prices but NEVER applies them automatically.
 */
export async function requestPriceChange(
  tenantId: string,
  analysis: PriceAnalysis
): Promise<PriceChangeRequest> {
  const supabase: any = createClient()

  const request: PriceChangeRequest = {
    tenantId,
    productSku: analysis.productSku,
    productName: analysis.productName,
    currentPrice: analysis.currentRetailPrice || 0,
    recommendedPrice: analysis.recommendedPrice,
    reason: analysis.reasoning,
    analysis,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    requestedBy: 'price_agent',
  }

  const { data, error } = await supabase
    .from('price_change_requests')
    .insert({
      tenant_id: request.tenantId,
      product_sku: request.productSku,
      product_name: request.productName,
      current_price: request.currentPrice,
      recommended_price: request.recommendedPrice,
      reason: request.reason,
      analysis_data: request.analysis,
      status: 'pending',
      requested_at: request.requestedAt,
      requested_by: 'price_agent',
    })
    .select('id')
    .single()

  if (data) request.id = data.id
  return request
}

/**
 * Approve a price change — only authorized users with pricing rights can call this.
 * Actually applies the new price to the product.
 */
export async function approvePriceChange(
  requestId: string,
  userId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase: any = createClient()

  // Fetch the pending request
  const { data: request, error: fetchError } = await supabase
    .from('price_change_requests')
    .select('*')
    .eq('id', requestId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    return { success: false, error: 'Price change request not found or already processed' }
  }

  // Apply the price change to the product
  const { error: updateError } = await supabase
    .from('products')
    .update({ price: request.recommended_price })
    .eq('sku', request.product_sku)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { success: false, error: `Failed to update product price: ${updateError.message}` }
  }

  // Mark request as approved
  await supabase
    .from('price_change_requests')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      applied_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  return { success: true }
}

/**
 * Reject a price change request
 */
export async function rejectPriceChange(
  requestId: string,
  userId: string,
  tenantId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase: any = createClient()

  const { error } = await supabase
    .from('price_change_requests')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      reason: reason || undefined,
    })
    .eq('id', requestId)
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Get pending price change requests for a tenant
 */
export async function getPendingPriceChanges(
  tenantId: string
): Promise<PriceChangeRequest[]> {
  const supabase: any = createClient()

  const { data, error } = await supabase
    .from('price_change_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    productSku: row.product_sku,
    productName: row.product_name,
    currentPrice: row.current_price,
    recommendedPrice: row.recommended_price,
    reason: row.reason,
    analysis: row.analysis_data,
    status: row.status,
    requestedAt: row.requested_at,
    requestedBy: row.requested_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    appliedAt: row.applied_at,
  }))
}

/**
 * Bulk approve multiple price changes
 */
export async function bulkApprovePriceChanges(
  requestIds: string[],
  userId: string,
  tenantId: string
): Promise<{ approved: number; failed: number; errors: string[] }> {
  let approved = 0
  let failed = 0
  const errors: string[] = []

  for (const id of requestIds) {
    const result = await approvePriceChange(id, userId, tenantId)
    if (result.success) {
      approved++
    } else {
      failed++
      errors.push(`${id}: ${result.error}`)
    }
  }

  return { approved, failed, errors }
}

function emptySummary(): PriceSummary {
  return {
    avgMargin: 0,
    belowMarket: 0,
    atMarket: 0,
    aboveMarket: 0,
    avgConfidence: 0,
    totalPotentialRevenue: 0,
    optimizedRevenue: 0,
    revenueDifference: 0,
  }
}
