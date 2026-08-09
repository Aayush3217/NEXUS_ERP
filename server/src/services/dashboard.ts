import { prisma } from '../config/prisma';
import { Role, CustomerStatus, ChallanStatus } from '@prisma/client';

export class DashboardService {
  static async getDashboardStats(role: Role) {
    const stats: any = {};

    // 1. WAREHOUSE users get inventory statistics only
    if (role === Role.WAREHOUSE) {
      const [totalProducts, lowStockProductsResult, outOfStockProducts] = await Promise.all([
        prisma.product.count(),
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*)::bigint as count FROM products WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0
        `,
        prisma.product.count({ where: { currentStock: 0 } }),
      ]);

      stats.totalProducts = totalProducts;
      stats.lowStockProducts = Number(lowStockProductsResult[0]?.count || 0);
      stats.outOfStockProducts = outOfStockProducts;
      return stats;
    }

    // 2. SALES, ACCOUNTS, and ADMIN get customer and challan statistics
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      lowStockProductsResult,
      outOfStockProducts,
      totalChallans,
      draftChallans,
      confirmedChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: CustomerStatus.ACTIVE } }),
      prisma.product.count(),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM products WHERE "currentStock" <= "minimumStock" AND "currentStock" > 0
      `,
      prisma.product.count({ where: { currentStock: 0 } }),
      prisma.salesChallan.count(),
      prisma.salesChallan.count({ where: { status: ChallanStatus.DRAFT } }),
      prisma.salesChallan.count({ where: { status: ChallanStatus.CONFIRMED } }),
    ]);

    stats.totalCustomers = totalCustomers;
    stats.activeCustomers = activeCustomers;
    stats.totalProducts = totalProducts;
    stats.lowStockProducts = Number(lowStockProductsResult[0]?.count || 0);
    stats.outOfStockProducts = outOfStockProducts;
    stats.totalChallans = totalChallans;
    stats.draftChallans = draftChallans;
    stats.confirmedChallans = confirmedChallans;

    // 3. Accounts and Admin see total financial summary
    if (role === Role.ADMIN || role === Role.ACCOUNTS) {
      // Calculate total revenue from confirmed challans
      const revenueResult = await prisma.salesChallanItem.aggregate({
        where: {
          challan: { status: ChallanStatus.CONFIRMED }
        },
        _sum: {
          totalPrice: true
        }
      });
      stats.confirmedRevenue = revenueResult._sum.totalPrice || 0;
    }

    return stats;
  }

  static async getRecentActivity(role: Role) {
    const activity: any = {};

    // 1. Fetch recent challans (for everyone except warehouse who only sees confirmed ones, or everyone sees all)
    // We'll return it for ADMIN, SALES, ACCOUNTS
    if (role !== Role.WAREHOUSE) {
      activity.recentChallans = await prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { businessName: true, customerName: true } },
          creator: { select: { name: true } },
        },
      });

      // Fetch upcoming customer followups
      activity.upcomingFollowUps = await prisma.customerFollowUp.findMany({
        take: 5,
        where: {
          followUpDate: { gte: new Date() }
        },
        orderBy: { followUpDate: 'asc' },
        include: {
          customer: { select: { businessName: true, customerName: true } },
          creator: { select: { name: true } }
        }
      });
    } else {
      // Warehouse sees recently confirmed challans to coordinate deliveries
      activity.recentChallans = await prisma.salesChallan.findMany({
        take: 5,
        where: { status: ChallanStatus.CONFIRMED },
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: { select: { businessName: true, customerName: true } },
        },
      });
    }

    // 2. Fetch stock movements (ADMIN, WAREHOUSE see all, SALES/ACCOUNTS don't need them or see limited)
    if (role === Role.ADMIN || role === Role.WAREHOUSE) {
      activity.recentMovements = await prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { productName: true, sku: true } },
          creator: { select: { name: true } },
        },
      });
    }

    return activity;
  }
}
