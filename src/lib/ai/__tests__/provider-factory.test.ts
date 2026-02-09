/**
 * AI Provider Factory Tests
 */

import { getAIProvider, resetProvider, isAIAvailable, getProviderName } from '../provider-factory'
import { OpenAIProvider } from '../openai-provider'
import { SelfHostedProvider } from '../self-hosted-provider'

describe('AI Provider Factory', () => {
  beforeEach(() => {
    resetProvider()
    delete process.env.AI_PROVIDER
    delete process.env.OPENAI_API_KEY
  })
  
  describe('getAIProvider', () => {
    it('should return OpenAI provider by default', () => {
      const provider = getAIProvider()
      expect(provider).toBeInstanceOf(OpenAIProvider)
      expect(provider.name).toBe('openai')
    })
    
    it('should return self-hosted provider when configured', () => {
      process.env.AI_PROVIDER = 'self-hosted'
      resetProvider()
      
      const provider = getAIProvider()
      expect(provider).toBeInstanceOf(SelfHostedProvider)
      expect(provider.name).toBe('self-hosted')
    })
    
    it('should cache provider instance', () => {
      const provider1 = getAIProvider()
      const provider2 = getAIProvider()
      expect(provider1).toBe(provider2)
    })
    
    it('should reset cached provider', () => {
      const provider1 = getAIProvider()
      resetProvider()
      const provider2 = getAIProvider()
      expect(provider1).not.toBe(provider2)
    })
  })
  
  describe('isAIAvailable', () => {
    it('should return false when API key is missing', () => {
      delete process.env.OPENAI_API_KEY
      resetProvider()
      expect(isAIAvailable()).toBe(false)
    })
    
    it('should return true when API key is present', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      resetProvider()
      expect(isAIAvailable()).toBe(true)
    })
  })
  
  describe('getProviderName', () => {
    it('should return provider name', () => {
      const name = getProviderName()
      expect(name).toBe('openai')
    })
  })
})

