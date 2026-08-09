import { z } from 'zod';
import { MovementType } from '@prisma/client';

export const StockMovementCreateSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  movementType: z.nativeEnum(MovementType, { errorMap: () => ({ message: 'Invalid movement type' }) }),
  reason: z.string().min(1, 'Reason is required'),
});
