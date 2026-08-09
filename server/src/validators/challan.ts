import { z } from 'zod';

export const ChallanItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const ChallanCreateSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(ChallanItemSchema).min(1, 'Challan must contain at least one item'),
});

export const ChallanUpdateSchema = ChallanCreateSchema.partial();
