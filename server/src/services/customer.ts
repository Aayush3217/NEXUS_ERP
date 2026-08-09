import { prisma } from '../config/prisma';
import { CustomerType, CustomerStatus } from '@prisma/client';
import { NotFoundError } from '../middleware/error';

interface GetCustomersParams {
  page: number;
  limit: number;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

export class CustomerService {
  static async getCustomers({ page, limit, search, status, customerType }: GetCustomersParams) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          include: {
            creator: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  static async createCustomer(data: {
    customerName: string;
    mobile: string;
    email?: string | null;
    businessName: string;
    gstNumber?: string | null;
    customerType: CustomerType;
    address: string;
    status: CustomerStatus;
    followUpDate?: Date | null;
    notes?: string | null;
  }) {
    return prisma.customer.create({
      data: data as any,
    });
  }

  static async updateCustomer(id: string, data: Partial<{
    customerName: string;
    mobile: string;
    email: string | null;
    businessName: string;
    gstNumber: string | null;
    customerType: CustomerType;
    address: string;
    status: CustomerStatus;
    followUpDate: Date | null;
    notes: string | null;
  }>) {
    // Check existence
    await this.getCustomerById(id);

    return prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async deleteCustomer(id: string) {
    await this.getCustomerById(id);
    return prisma.customer.delete({
      where: { id },
    });
  }

  static async addFollowUp(customerId: string, note: string, followUpDate: Date, userId: string) {
    // Ensure customer exists
    const customer = await this.getCustomerById(customerId);

    // Run in transaction to update followUpDate on customer and add followUp timeline item
    return prisma.$transaction(async (tx) => {
      const followUp = await tx.customerFollowUp.create({
        data: {
          customerId,
          note,
          followUpDate,
          createdBy: userId,
        },
        include: {
          creator: {
            select: { name: true, email: true },
          },
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { followUpDate },
      });

      return followUp;
    });
  }

  static async getFollowUps(customerId: string) {
    await this.getCustomerById(customerId);
    return prisma.customerFollowUp.findMany({
      where: { customerId },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
