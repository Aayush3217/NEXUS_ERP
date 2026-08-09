import { Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory';
import { StockMovementCreateSchema } from '../validators/inventory';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';
import { MovementType } from '@prisma/client';

export const getInventoryStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await InventoryService.getInventoryStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

export const createStockMovement = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = StockMovementCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const { updatedProduct, movement } = await InventoryService.createStockMovement({
      ...validation.data,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: {
        product: updatedProduct,
        movement,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMovements = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const productId = req.query.productId as string;
    const movementType = req.query.movementType as MovementType;

    const result = await InventoryService.getMovements({ page, limit, productId, movementType });

    res.status(200).json({
      success: true,
      data: result.movements,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};
