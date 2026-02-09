/**
 * AI Provider Abstraction Layer - Types and Interfaces
 * 
 * This abstraction allows easy switching between OpenAI API and self-hosted AI models
 * without changing application code.
 */

// ============================================================================
// Product Analysis Types
// ============================================================================

export interface ProductAnalysis {
  /** Detected product type (e.g., "Surfboard", "Wetsuit", "Paddleboard") */
  productType: string
  
  /** Suggested category for the product */
  category: string
  
  /** Detected colors in the product */
  colors: string[]
  
  /** Extracted features and specifications */
  features: string[]
  
  /** AI-generated product name */
  suggestedName: string
  
  /** AI-generated product description */
  description: string
  
  /** Suggested tags for SEO and filtering */
  tags: string[]
  
  /** Image quality score (0-100) */
  imageQuality: number
  
  /** Suggested price based on similar products (in ZAR) */
  suggestedPrice: number | null
  
  /** Confidence score of the analysis (0-1) */
  confidence: number
  
  /** Additional metadata */
  metadata?: {
    brand?: string
    material?: string
    size?: string
    condition?: string
    [key: string]: any
  }
}

// ============================================================================
// SEO Generation Types
// ============================================================================

export interface SEOMetadata {
  /** SEO-optimized title (50-60 characters) */
  title: string
  
  /** SEO-optimized meta description (150-160 characters) */
  description: string
  
  /** Keywords for SEO */
  keywords: string[]
  
  /** Open Graph title */
  ogTitle: string
  
  /** Open Graph description */
  ogDescription: string
  
  /** Twitter Card title */
  twitterTitle: string
  
  /** Twitter Card description */
  twitterDescription: string
  
  /** Alt text for images */
  imageAlt: string
  
  /** Schema.org structured data */
  structuredData?: Record<string, any>
}

// ============================================================================
// AI Provider Interface
// ============================================================================

export interface AIProvider {
  /** Provider name (e.g., "openai", "self-hosted") */
  readonly name: string
  
  /** Whether the provider is available */
  readonly isAvailable: boolean
  
  /**
   * Analyze a product image and extract information
   * @param imageUrl - URL of the product image
   * @param options - Additional options for analysis
   * @returns Product analysis results
   */
  analyzeProductImage(
    imageUrl: string,
    options?: {
      includePrice?: boolean
      category?: string
      tenantId?: string
    }
  ): Promise<ProductAnalysis>
  
  /**
   * Generate a product description
   * @param product - Product data
   * @returns Generated description
   */
  generateDescription(product: {
    name: string
    category?: string
    features?: string[]
    price?: number
  }): Promise<string>
  
  /**
   * Generate SEO metadata for a product
   * @param product - Product data
   * @returns SEO metadata
   */
  generateSEOMetadata(product: {
    name: string
    description?: string
    category?: string
    price?: number
  }): Promise<SEOMetadata>
  
  /**
   * Generate alt text for an image
   * @param imageUrl - URL of the image
   * @returns Alt text
   */
  generateImageAlt(imageUrl: string): Promise<string>
  
  /**
   * Batch analyze multiple products
   * @param imageUrls - Array of image URLs
   * @returns Array of product analyses
   */
  batchAnalyze(imageUrls: string[]): Promise<ProductAnalysis[]>
}

// ============================================================================
// Cost Tracking Types
// ============================================================================

export interface AIUsageRecord {
  id: string
  tenantId: string
  operation: AIOperation
  provider: string
  tokensUsed: number
  cost: number
  timestamp: Date
  metadata?: Record<string, any>
}

export type AIOperation =
  | 'product_analysis'
  | 'description_generation'
  | 'seo_generation'
  | 'image_alt_generation'
  | 'batch_analysis'

export interface AIUsageStats {
  totalOperations: number
  totalTokens: number
  totalCost: number
  operationBreakdown: Record<AIOperation, {
    count: number
    tokens: number
    cost: number
  }>
  period: {
    start: Date
    end: Date
  }
}

// ============================================================================
// Provider Configuration
// ============================================================================

export interface AIProviderConfig {
  provider: 'openai' | 'self-hosted'
  apiKey?: string
  endpoint?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

