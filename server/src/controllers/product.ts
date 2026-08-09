import { Response, NextFunction } from 'express';
import { ProductService } from '../services/product';
import { ProductCreateSchema, ProductUpdateSchema } from '../validators/product';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';

export const getProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const lowStock = req.query.lowStock === 'true';

    const result = await ProductService.getProducts({ page, limit, search, category, lowStock });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = ProductCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const product = await ProductService.createProduct(validation.data);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = ProductUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const product = await ProductService.updateProduct(req.params.id, validation.data);
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
