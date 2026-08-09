import { prisma } from '../config/prisma';
import { ChallanStatus, MovementType, Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../middleware/error';

interface GetChallansParams {
  page: number;
  limit: number;
  search?: string;
  status?: ChallanStatus;
}

export class SalesChallanService {
  static async generateChallanNumber(): Promise<string> {
    const today = new Date();
    const yyyymmdd = today.getUTCFullYear().toString() +
      String(today.getUTCMonth() + 1).padStart(2, '0') +
      String(today.getUTCDate()).padStart(2, '0');

    const todayStart = new Date(today);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Get count of challans created today to make the next sequence
    const count = await prisma.salesChallan.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    let sequence = count + 1;
    let challanNumber = `CH-${yyyymmdd}-${String(sequence).padStart(4, '0')}`;

    // Verify it is unique, if not, increment until unique (handles concurrent transactions)
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
      const existing = await prisma.salesChallan.findUnique({
        where: { challanNumber },
      });
      if (!existing) {
        isUnique = true;
      } else {
        sequence++;
        challanNumber = `CH-${yyyymmdd}-${String(sequence).padStart(4, '0')}`;
        attempts++;
      }
    }

    return challanNumber;
  }

  static async getChallans({ page, limit, search, status }: GetChallansParams) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { customerName: { contains: search, mode: 'insensitive' } },
              { businessName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, challans] = await Promise.all([
      prisma.salesChallan.count({ where }),
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { customerName: true, businessName: true },
          },
          creator: {
            select: { name: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      challans,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getChallanById(id: string) {
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        creator: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { productName: true, sku: true, currentStock: true },
            },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundError('Sales challan not found');
    }

    return challan;
  }

  static async createDraftChallan(data: {
    customerId: string;
    createdBy: string;
    items: { productId: string; quantity: number }[];
  }) {
    const { customerId, createdBy, items } = data;

    if (!items || items.length === 0) {
      throw new BadRequestError('Challan must contain at least one item');
    }

    // Validate customer existence
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Resolve snapshot data for all products
    const resolvedItems = [];
    let totalQuantity = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new BadRequestError('Quantity for each item must be greater than 0');
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundError(`Product not found for ID: ${item.productId}`);
      }

      resolvedItems.push({
        productId: product.id,
        productNameSnapshot: product.productName,
        skuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: item.quantity,
        totalPrice: product.unitPrice * item.quantity,
      });

      totalQuantity += item.quantity;
    }

    const challanNumber = await this.generateChallanNumber();

    // Create the challan in DRAFT mode
    return prisma.salesChallan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        createdBy,
        items: {
          create: resolvedItems,
        },
      },
      include: {
        customer: {
          select: { customerName: true, businessName: true },
        },
        items: true,
      },
    });
  }

  static async updateDraftChallan(
    id: string,
    data: {
      customerId?: string;
      items?: { productId: string; quantity: number }[];
    }
  ) {
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new NotFoundError('Challan not found');
    }

    if (challan.status !== ChallanStatus.DRAFT) {
      throw new BadRequestError('Only DRAFT challans can be edited');
    }

    // Run update in transaction
    return prisma.$transaction(async (tx) => {
      // If customer is updating
      let customerId = challan.customerId;
      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
        });
        if (!customer) {
          throw new NotFoundError('Customer not found');
        }
        customerId = data.customerId;
      }

      // If items are updating
      if (data.items) {
        if (data.items.length === 0) {
          throw new BadRequestError('Challan must contain at least one item');
        }

        // Delete old items
        await tx.salesChallanItem.deleteMany({
          where: { challanId: id },
        });

        // Resolve new items
        const resolvedItems = [];
        let totalQuantity = 0;

        for (const item of data.items) {
          if (item.quantity <= 0) {
            throw new BadRequestError('Quantity must be greater than 0');
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundError(`Product not found for ID: ${item.productId}`);
          }

          resolvedItems.push({
            challanId: id,
            productId: product.id,
            productNameSnapshot: product.productName,
            skuSnapshot: product.sku,
            unitPriceSnapshot: product.unitPrice,
            quantity: item.quantity,
            totalPrice: product.unitPrice * item.quantity,
          });

          totalQuantity += item.quantity;
        }

        // Create new items
        await tx.salesChallanItem.createMany({
          data: resolvedItems,
        });

        // Update Challan totals
        return tx.salesChallan.update({
          where: { id },
          data: {
            customerId,
            totalQuantity,
          },
          include: {
            customer: { select: { customerName: true, businessName: true } },
            items: true,
          },
        });
      }

      // If only customer changed
      return tx.salesChallan.update({
        where: { id },
        data: { customerId },
        include: {
          customer: { select: { customerName: true, businessName: true } },
          items: true,
        },
      });
    });
  }

  static async confirmChallan(challanId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the challan and its items
      const challan = await tx.salesChallan.findUnique({
        where: { id: challanId },
        include: {
          items: true,
          customer: true,
        },
      });

      if (!challan) {
        throw new NotFoundError('Sales challan not found');
      }

      // 2. Validate status is DRAFT
      if (challan.status !== ChallanStatus.DRAFT) {
        throw new BadRequestError(`Challan cannot be confirmed. Current status: ${challan.status}`);
      }

      // 3. Loop through all items and validate stock availability
      for (const item of challan.items) {
        // SELECT ... FOR UPDATE (Row lock) to prevent race conditions
        const products = await tx.$queryRaw<any[]>`
          SELECT id, "productName", "currentStock" FROM products 
          WHERE id = ${item.productId}::uuid 
          FOR UPDATE
        `;

        if (!products || products.length === 0) {
          throw new NotFoundError(`Product snapshot '${item.productNameSnapshot}' no longer exists in current inventory.`);
        }

        const product = products[0];

        if (product.currentStock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for product '${product.productName}'. Available: ${product.currentStock}, Requested: ${item.quantity}.`
          );
        }

        // 4. Update Product Stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: product.currentStock - item.quantity,
          },
        });

        // 5. Log OUT StockMovement
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            quantity: item.quantity,
            movementType: MovementType.OUT,
            reason: `Sales Challan Confirmation: ${challan.challanNumber}`,
            createdBy: userId,
          },
        });
      }

      // 6. Mark Challan as CONFIRMED
      const confirmedChallan = await tx.salesChallan.update({
        where: { id: challanId },
        data: {
          status: ChallanStatus.CONFIRMED,
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return confirmedChallan;
    });
  }

  static async cancelDraftChallan(challanId: string) {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: challanId },
    });

    if (!challan) {
      throw new NotFoundError('Sales challan not found');
    }

    if (challan.status !== ChallanStatus.DRAFT) {
      throw new BadRequestError(`Only DRAFT challans can be cancelled. Current status is ${challan.status}`);
    }

    return prisma.salesChallan.update({
      where: { id: challanId },
      data: {
        status: ChallanStatus.CANCELLED,
      },
    });
  }
}
