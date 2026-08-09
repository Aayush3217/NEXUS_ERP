import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../middleware/error';

interface GetProductsParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export class ProductService {
  static async getProducts({ page, limit, search, category, lowStock }: GetProductsParams) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { productName: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      // Fetch IDs of products where currentStock <= minimumStock using a raw query
      const lowStockProducts = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM products WHERE "currentStock" <= "minimumStock"
      `;
      const lowStockIds = lowStockProducts.map(p => p.id);
      
      where.id = { in: lowStockIds };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sku: 'asc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  static async createProduct(data: {
    productName: string;
    sku: string;
    category: string;
    unitPrice: number;
    currentStock: number;
    minimumStock: number;
    warehouseLocation: string;
  }) {
    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existing) {
      throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
    }

    return prisma.product.create({
      data,
    });
  }

  static async updateProduct(id: string, data: Partial<{
    productName: string;
    sku: string;
    category: string;
    unitPrice: number;
    currentStock: number;
    minimumStock: number;
    warehouseLocation: string;
  }>) {
    await this.getProductById(id);

    if (data.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing && existing.id !== id) {
        throw new ConflictError(`Product with SKU '${data.sku}' already exists`);
      }
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async deleteProduct(id: string) {
    await this.getProductById(id);
    return prisma.product.delete({
      where: { id },
    });
  }
}
