import { Response, NextFunction } from 'express';
import { UserService } from '../services/user';
import { UserCreateSchema, UserUpdateSchema } from '../validators/user';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = UserCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const user = await UserService.createUser(validation.data);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validation = UserUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new BadRequestError('Validation failed', validation.error.errors));
    }

    const user = await UserService.updateUser(req.params.id, validation.data);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await UserService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
