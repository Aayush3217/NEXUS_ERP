import { Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer';
import { CustomerCreateSchema, CustomerUpdateSchema, FollowUpCreateSchema } from '../validators/customer';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const getCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as CustomerStatus;
    const customerType = req.query.customerType as CustomerType;

    const result = await CustomerService.getCustomers({ page, limit, search, status, customerType });

    res.status(200).json({
      success: true,
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = CustomerCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const customer = await CustomerService.createCustomer(validation.data);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = CustomerUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const customer = await CustomerService.updateCustomer(req.params.id, validation.data);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await CustomerService.deleteCustomer(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const addFollowUp = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = FollowUpCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const followUp = await CustomerService.addFollowUp(
      req.params.id,
      validation.data.note,
      validation.data.followUpDate,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: followUp,
    });
  } catch (err) {
    next(err);
  }
};

export const getFollowUps = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const followUps = await CustomerService.getFollowUps(req.params.id);
    res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (err) {
    next(err);
  }
};
