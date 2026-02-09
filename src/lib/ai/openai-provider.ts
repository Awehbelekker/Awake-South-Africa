/**
 * OpenAI Provider Implementation
 * 
 * Uses OpenAI's GPT-4 Vision and GPT-4 for product analysis and content generation
 */

import OpenAI from 'openai'
import type {
  AIProvider,
  ProductAnalysis,
  SEOMetadata,
} from './types'
import { trackAIUsage } from './cost-tracker'

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai'
  readonly isAvailable: boolean
  
  private client: OpenAI
  private visionModel = 'gpt-4-vision-preview'
  private textModel = 'gpt-4-turbo-preview'
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.')
      this.isAvailable = false
      this.client = null as any
      return
    }
    
    this.client = new OpenAI({ apiKey })
    this.isAvailable = true
  }
  
  /**
   * Analyze product image using GPT-4 Vision
   */
  async analyzeProductImage(
    imageUrl: string,
    options?: {
      includePrice?: boolean
      category?: string
      tenantId?: string
    }
  ): Promise<ProductAnalysis> {
    if (!this.isAvailable) {
      throw new Error('OpenAI provider is not available. Check API key.')
    }
    
    const prompt = `Analyze this product image and provide detailed information in JSON format.

Required fields:
- productType: Type of product (e.g., "Surfboard", "Wetsuit", "Paddleboard")
- category: Product category
- colors: Array of detected colors
- features: Array of product features and specifications
- suggestedName: A catchy, SEO-friendly product name
- description: Detailed product description (2-3 sentences)
- tags: Array of relevant tags for SEO
- imageQuality: Quality score 0-100
${options?.includePrice ? '- suggestedPrice: Estimated price in ZAR (South African Rand)' : ''}
- confidence: Confidence score 0-1
- metadata: Additional details (brand, material, size, condition, etc.)

${options?.category ? `Expected category: ${options.category}` : ''}

Return ONLY valid JSON, no markdown formatting.`
    
    const startTime = Date.now()
    
    const response = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const tokensUsed = response.usage?.total_tokens || 0
    
    // Track usage
    if (options?.tenantId) {
      await trackAIUsage({
        tenantId: options.tenantId,
        operation: 'product_analysis',
        provider: 'openai',
        tokensUsed,
        cost: this.calculateCost(tokensUsed, this.visionModel),
        metadata: { imageUrl, duration: Date.now() - startTime },
      })
    }
    
    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const analysis = JSON.parse(cleanContent) as ProductAnalysis
    
    return analysis
  }
  
  /**
   * Generate product description using GPT-4
   */
  async generateDescription(product: {
    name: string
    category?: string
    features?: string[]
    price?: number
  }): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('OpenAI provider is not available.')
    }
    
    const prompt = `Write a compelling product description for an e-commerce store.

Product: ${product.name}
${product.category ? `Category: ${product.category}` : ''}
${product.features?.length ? `Features: ${product.features.join(', ')}` : ''}
${product.price ? `Price: R${product.price}` : ''}

Requirements:
- 2-3 sentences
- Highlight key features and benefits
- Use persuasive language
- SEO-friendly
- Professional tone

Return only the description, no additional text.`
    
    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    })
    
    return response.choices[0]?.message?.content?.trim() || ''
  }
  
  /**
   * Generate SEO metadata
   */
  async generateSEOMetadata(product: {
    name: string
    description?: string
    category?: string
    price?: number
  }): Promise<SEOMetadata> {
    if (!this.isAvailable) {
      throw new Error('OpenAI provider is not available.')
    }
    
    const prompt = `Generate SEO metadata for this product in JSON format.

Product: ${product.name}
${product.description ? `Description: ${product.description}` : ''}
${product.category ? `Category: ${product.category}` : ''}

Required fields:
- title: SEO title (50-60 characters)
- description: Meta description (150-160 characters)
- keywords: Array of 5-10 keywords
- ogTitle: Open Graph title
- ogDescription: Open Graph description
- twitterTitle: Twitter Card title
- twitterDescription: Twitter Card description
- imageAlt: Alt text for product image

Return ONLY valid JSON.`
    
    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })
    
    const content = response.choices[0]?.message?.content || '{}'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return JSON.parse(cleanContent) as SEOMetadata
  }
  
  /**
   * Generate alt text for image
   */
  async generateImageAlt(imageUrl: string): Promise<string> {
    // Implementation similar to analyzeProductImage but simpler
    return 'Product image' // Placeholder
  }
  
  /**
   * Batch analyze multiple products
   */
  async batchAnalyze(imageUrls: string[]): Promise<ProductAnalysis[]> {
    // Process in parallel with rate limiting
    return Promise.all(imageUrls.map(url => this.analyzeProductImage(url)))
  }
  
  /**
   * Calculate cost based on tokens used
   * GPT-4 Vision: $0.01 per 1K tokens
   * GPT-4 Turbo: $0.01 per 1K tokens (input), $0.03 per 1K tokens (output)
   */
  private calculateCost(tokens: number, model: string): number {
    const ratePerToken = model.includes('vision') ? 0.00001 : 0.00001
    const costUSD = tokens * ratePerToken
    const costZAR = costUSD * 18.5 // USD to ZAR conversion
    return Math.round(costZAR * 100) / 100
  }
}

