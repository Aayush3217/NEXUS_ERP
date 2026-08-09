import { prisma } from '../config/prisma';
import { MovementType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../middleware/error';

interface GetMovementsParams {
  page: number;
  limit: number;
  productId?: string;
  movementType?: MovementType;
}

export class InventoryService {
  static async getInventoryStats() {
    const products = await prisma.product.findMany({
      select: {
        currentStock: true,
        minimumStock: true,
      },
    });

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const p of products) {
      totalStockUnits += p.currentStock;
      if (p.currentStock === 0) {
        outOfStockProducts++;
      } else if (p.currentStock <= p.minimumStock) {
        lowStockProducts++;
      }
    }

    return {
      totalProducts,
      totalStockUnits,
      lowStockProducts,
      outOfStockProducts,
    };
  }

  static async createStockMovement(data: {
    productId: string;
    quantity: number;
    movementType: MovementType;
    reason: string;
    createdBy: string;
  }) {
    const { productId, quantity, movementType, reason, createdBy } = data;

    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than 0');
    }

    // Run as transaction
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      let newStock = product.currentStock;

      if (movementType === MovementType.IN) {
        newStock += quantity;
      } else if (movementType === MovementType.OUT) {
        if (product.currentStock < quantity) {
          throw new BadRequestError(`Insufficient stock. Available: ${product.currentStock}, Requested: ${quantity}`);
        }
        newStock -= quantity;
      }

      // Update product currentStock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantity,
          movementType,
          reason,
          createdBy,
        },
        include: {
          product: {
            select: { productName: true, sku: true },
          },
          creator: {
            select: { name: true },
          },
        },
      });

      return { updatedProduct, movement };
    });
  }

  static async getMovements({ page, limit, productId, movementType }: GetMovementsParams) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { productName: true, sku: true },
          },
          creator: {
            select: { name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
