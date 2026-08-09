import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotFoundError, ConflictError } from '../middleware/error';

export class UserService {
  static async getUsers() {
    return prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  static async createUser(data: {
    name: string;
    email: string;
    passwordHash: string; // raw password passed in, hashed here
    role: Role;
    isActive?: boolean;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictError(`User with email '${data.email}' already exists`);
    }

    const hashed = await bcrypt.hash(data.passwordHash, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashed,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  static async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      passwordHash: string; // raw password
      role: Role;
      isActive: boolean;
    }>
  ) {
    await this.getUserById(id);

    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictError(`User with email '${data.email}' already exists`);
      }
    }

    const updateData: any = { ...data };

    if (data.passwordHash) {
      updateData.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteUser(id: string) {
    await this.getUserById(id);
    return prisma.user.delete({
      where: { id },
    });
  }
}
