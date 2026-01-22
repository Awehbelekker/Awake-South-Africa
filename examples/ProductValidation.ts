import { z } from 'zod'

/**
 * Product Validation Schema
 * 
 * Comprehensive validation for product data using Zod.
 * Ensures data integrity before saving to database.
 * 
 * Installation:
 * npm install zod
 * 
 * Usage:
 * import { ProductSchema, validateProduct } from './ProductValidation'
 * 
 * const result = validateProduct(productData)
 * if (result.success) {
 *   // Save product
 * } else {
 *   // Show errors: result.errors
 * }
 */

export const ProductSchema = z.object({
  // Required fields
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must be less than 100 characters')
    .trim(),

  price: z.number()
    .positive('Price must be positive')
    .max(10000000, 'Price seems unreasonably high')
    .refine(val => val % 1 === 0 || val.toFixed(2).length <= 10, 'Invalid price format'),

  priceExVAT: z.number()
    .positive('Price ex VAT must be positive')
    .optional(),

  category: z.string()
    .min(1, 'Category is required'),

  stockQuantity: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock quantity seems unreasonably high'),

  // Optional fields
  costEUR: z.number()
    .positive('Cost must be positive')
    .optional(),

  categoryTag: z.string().optional(),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description is too long')
    .optional(),

  image: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.string().startsWith('data:image/', 'Invalid image data'))
    .optional(),

  images: z.array(z.string().url('Invalid image URL'))
    .max(10, 'Maximum 10 images allowed')
    .optional(),

  specs: z.array(z.string().min(1, 'Spec cannot be empty'))
    .min(1, 'At least one specification required')
    .max(20, 'Maximum 20 specifications allowed')
    .optional(),

  features: z.array(z.string().min(1, 'Feature cannot be empty'))
    .min(1, 'At least one feature required')
    .max(20, 'Maximum 20 features allowed')
    .optional(),

  badge: z.string().optional(),
  battery: z.string().optional(),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Expert', 'Professional']).optional(),
  inStock: z.boolean().optional(),
})

export type ValidatedProduct = z.infer<typeof ProductSchema>

/**
 * Validate product data
 * Returns success status and either validated data or errors
 */
export function validateProduct(data: any): {
  success: boolean
  data?: ValidatedProduct
  errors?: Record<string, string[]>
} {
  try {
    const validated = ProductSchema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _general: ['Validation failed'] } }
  }
}

/**
 * Validate partial product data (for updates)
 * Only validates fields that are present
 */
export function validatePartialProduct(data: any): {
  success: boolean
  data?: Partial<ValidatedProduct>
  errors?: Record<string, string[]>
} {
  try {
    const validated = ProductSchema.partial().parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.issues.forEach((err) => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _general: ['Validation failed'] } }
  }
}

/**
 * Custom validation rules
 */
export const customValidations = {
  // Ensure price includes VAT correctly
  validatePriceWithVAT: (price: number, priceExVAT: number, vatRate: number = 0.15) => {
    const expectedPrice = priceExVAT * (1 + vatRate)
    const tolerance = 1 // Allow R1 difference due to rounding
    return Math.abs(price - expectedPrice) <= tolerance
  },

  // Ensure margin is within acceptable range
  validateMargin: (priceExVAT: number, costEUR: number, exchangeRate: number) => {
    const costZAR = costEUR * exchangeRate
    const margin = ((priceExVAT - costZAR) / priceExVAT) * 100
    return margin >= 0 && margin <= 100 // Margin should be between 0-100%
  },

  // Validate image URL is accessible
  validateImageUrl: async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  },
}

