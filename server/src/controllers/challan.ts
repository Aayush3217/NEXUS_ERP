import { Response, NextFunction } from 'express';
import { SalesChallanService } from '../services/challan';
import { ChallanCreateSchema, ChallanUpdateSchema } from '../validators/challan';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';
import { ChallanStatus } from '@prisma/client';

export const getChallans = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as ChallanStatus;

    const result = await SalesChallanService.getChallans({ page, limit, search, status });

    res.status(200).json({
      success: true,
      data: result.challans,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getChallanById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const challan = await SalesChallanService.getChallanById(req.params.id);
    res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (err) {
    next(err);
  }
};

export const createDraftChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = ChallanCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const challan = await SalesChallanService.createDraftChallan({
      ...validation.data,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: challan,
    });
  } catch (err) {
    next(err);
  }
};

export const updateDraftChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = ChallanUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const challan = await SalesChallanService.updateDraftChallan(req.params.id, validation.data);

    res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (err) {
    next(err);
  }
};

export const confirmChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const confirmedChallan = await SalesChallanService.confirmChallan(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      data: confirmedChallan,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelDraftChallan = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cancelledChallan = await SalesChallanService.cancelDraftChallan(req.params.id);

    res.status(200).json({
      success: true,
      data: cancelledChallan,
    });
  } catch (err) {
    next(err);
  }
};
