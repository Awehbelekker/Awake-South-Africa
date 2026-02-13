/**
 * AI Provider Abstraction Layer - Main Exports
 * 
 * Usage:
 * 
 * ```typescript
 * import { getAIProvider } from '@/lib/ai'
 * 
 * const ai = getAIProvider()
 * const analysis = await ai.analyzeProductImage(imageUrl, { tenantId: 'xxx' })
 * ```
 */

// Types
export type {
  AIProvider,
  ProductAnalysis,
  SEOMetadata,
  AIUsageRecord,
  AIOperation,
  AIUsageStats,
  AIProviderConfig,
} from './types'

// Provider implementations
// export { OpenAIProvider } from './openai-provider' // Commented out - requires 'openai' package
export { SelfHostedProvider } from './self-hosted-provider'

// Provider factory
export {
  getAIProvider,
  resetProvider,
  isAIAvailable,
  getProviderName,
} from './provider-factory'

// Cost tracking
export {
  trackAIUsage,
  getAIUsageStats,
  shouldSwitchToSelfHosted,
  getCostProjection,
  getAllTenantsUsage,
} from './cost-tracker'

