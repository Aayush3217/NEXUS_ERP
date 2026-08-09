import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard';
import { BadRequestError } from '../middleware/error';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const stats = await DashboardService.getDashboardStats(req.user.role);
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

export const getRecentActivity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new BadRequestError('User context required'));
    }

    const activity = await DashboardService.getRecentActivity(req.user.role);

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};
