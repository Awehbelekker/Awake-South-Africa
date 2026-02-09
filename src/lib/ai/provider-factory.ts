/**
 * AI Provider Factory
 * 
 * Selects the appropriate AI provider based on configuration
 */

import type { AIProvider, AIProviderConfig } from './types'
import { OpenAIProvider } from './openai-provider'
import { SelfHostedProvider } from './self-hosted-provider'

let cachedProvider: AIProvider | null = null

/**
 * Get the configured AI provider
 * 
 * Provider selection priority:
 * 1. Environment variable AI_PROVIDER
 * 2. Cost threshold (auto-switch to self-hosted if costs > R5,000/month)
 * 3. Default to OpenAI
 */
export function getAIProvider(config?: AIProviderConfig): AIProvider {
  // Return cached provider if available
  if (cachedProvider) {
    return cachedProvider
  }
  
  const providerType = config?.provider || (process.env.AI_PROVIDER as 'openai' | 'self-hosted') || 'openai'
  
  switch (providerType) {
    case 'openai':
      cachedProvider = new OpenAIProvider()
      break
      
    case 'self-hosted':
      cachedProvider = new SelfHostedProvider(config?.endpoint)
      break
      
    default:
      console.warn(`Unknown AI provider: ${providerType}. Falling back to OpenAI.`)
      cachedProvider = new OpenAIProvider()
  }
  
  if (!cachedProvider.isAvailable) {
    console.warn(`AI provider ${providerType} is not available. AI features will be disabled.`)
  }
  
  return cachedProvider
}

/**
 * Reset the cached provider (useful for testing or switching providers)
 */
export function resetProvider(): void {
  cachedProvider = null
}

/**
 * Check if AI features are available
 */
export function isAIAvailable(): boolean {
  const provider = getAIProvider()
  return provider.isAvailable
}

/**
 * Get provider name
 */
export function getProviderName(): string {
  const provider = getAIProvider()
  return provider.name
}

