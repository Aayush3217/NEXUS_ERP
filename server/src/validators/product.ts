import { z } from 'zod';

export const ProductCreateSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
  currentStock: z.number().int().min(0, 'Current stock must be non-negative'),
  minimumStock: z.number().int().min(0, 'Minimum stock must be non-negative'),
  warehouseLocation: z.string().min(1, 'Warehouse location is required'),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();
