import { z } from 'zod';

// Base product schema without refinements
const BaseProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name must be at least 1 character').max(100, 'Name must be less than 100 characters'),
  price: z.number().positive('Price must be positive'),
  priceExVAT: z.number().positive('Price ex VAT must be positive'),
  costEUR: z.number().positive('Cost must be positive').optional(),
  category: z.string().min(1, 'Category is required'),
  categoryTag: z.string().min(1, 'Category tag is required').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  image: z.string().optional(),
  badge: z.string().optional(),
  battery: z.string().optional(),
  skillLevel: z.string().optional(),
  specs: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  inStock: z.boolean(),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
});

// Product validation schema with refinements
export const ProductSchema = BaseProductSchema.refine((data) => {
  // Ensure price ex VAT is less than price
  return data.priceExVAT < data.price;
}, {
  message: 'Price ex VAT must be less than price with VAT',
  path: ['priceExVAT'],
}).refine((data) => {
  // Ensure cost is less than price (if cost is provided)
  if (data.costEUR) {
    return data.costEUR < data.priceExVAT;
  }
  return true;
}, {
  message: 'Cost must be less than price',
  path: ['costEUR'],
});

// Partial schema for updates (without refinements for flexibility)
export const PartialProductSchema = BaseProductSchema.partial();

// Type inference
export type ProductFormData = z.infer<typeof ProductSchema>;
export type PartialProductFormData = z.infer<typeof PartialProductSchema>;

// Validation functions
export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}

export function validatePartialProduct(data: unknown) {
  return PartialProductSchema.safeParse(data);
}

// Custom validation helpers
export function validateMargin(costEUR: number, priceExVAT: number, targetMargin: number = 0.35): boolean {
  const actualMargin = (priceExVAT - costEUR) / priceExVAT;
  return actualMargin >= targetMargin;
}

export function calculateVAT(priceExVAT: number, vatRate: number = 0.15): number {
  return priceExVAT * (1 + vatRate);
}

export function calculatePriceExVAT(priceWithVAT: number, vatRate: number = 0.15): number {
  return priceWithVAT / (1 + vatRate);
}

export function convertEURtoZAR(eurAmount: number, exchangeRate: number = 19.85): number {
  return eurAmount * exchangeRate;
}

