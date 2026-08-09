import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(getProducts) // all roles can view
  .post(authorize(Role.ADMIN), createProduct);

router.route('/:id')
  .get(getProductById) // all roles can view
  .put(authorize(Role.ADMIN), updateProduct)
  .delete(authorize(Role.ADMIN), deleteProduct);

export default router;
