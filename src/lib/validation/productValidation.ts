import { z } from 'zod';

const BaseProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(200),
  price: z.number().min(0, 'Price must be 0 or greater'),
  priceExVAT: z.number().min(0).optional(),
  costEUR: z.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  categoryTag: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  badge: z.string().optional(),
  battery: z.string().optional(),
  skillLevel: z.string().optional(),
  specs: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  whatsIncluded: z.array(z.string()).optional(),
  inStock: z.boolean().optional().default(true),
  stockQuantity: z.number().int().min(0).optional().default(0),
}).passthrough(); // allow _supabaseId, _slug, images etc. without error

export const ProductSchema = BaseProductSchema;
export const PartialProductSchema = BaseProductSchema.partial();

export type ProductFormData = z.infer<typeof ProductSchema>;
export type PartialProductFormData = z.infer<typeof PartialProductSchema>;

export function validateProduct(data: unknown) {
  return ProductSchema.safeParse(data);
}

export function validatePartialProduct(data: unknown) {
  return PartialProductSchema.safeParse(data);
}

export function validateMargin(costEUR: number, priceExVAT: number, targetMargin = 0.35): boolean {
  const actualMargin = (priceExVAT - costEUR) / priceExVAT;
  return actualMargin >= targetMargin;
}

export function calculateVAT(priceExVAT: number, vatRate = 0.15): number {
  return priceExVAT * (1 + vatRate);
}

export function calculatePriceExVAT(priceWithVAT: number, vatRate = 0.15): number {
  return priceWithVAT / (1 + vatRate);
}

export function convertEURtoZAR(eurAmount: number, exchangeRate = 19.85): number {
  return eurAmount * exchangeRate;
}
