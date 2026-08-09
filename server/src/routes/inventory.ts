import { Router } from 'express';
import {
  getInventoryStats,
  createStockMovement,
  getMovements,
} from '../controllers/inventory';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', getInventoryStats); // all roles can view stats

router.route('/movements')
  .get(authorize(Role.ADMIN, Role.WAREHOUSE), getMovements)
  .post(authorize(Role.ADMIN, Role.WAREHOUSE), createStockMovement);

export default router;
