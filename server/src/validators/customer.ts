import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const CustomerCreateSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')).nullable(),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().max(15, 'GST must be maximum 15 characters').optional().or(z.literal('')).nullable(),
  customerType: z.nativeEnum(CustomerType, { errorMap: () => ({ message: 'Invalid customer type' }) }),
  address: z.string().min(1, 'Address is required'),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.ACTIVE),
  followUpDate: z.string().datetime().optional().nullable().or(z.literal('')).transform(val => val ? new Date(val) : null),
  notes: z.string().optional().nullable(),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export const FollowUpCreateSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
  followUpDate: z.string().datetime('Invalid follow-up date format').transform(val => new Date(val)),
});
