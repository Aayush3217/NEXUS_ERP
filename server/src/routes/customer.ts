import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addFollowUp,
  getFollowUps,
} from '../controllers/customer';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomers)
  .post(authorize(Role.ADMIN, Role.SALES), createCustomer);

router.route('/:id')
  .get(authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getCustomerById)
  .put(authorize(Role.ADMIN, Role.SALES), updateCustomer)
  .delete(authorize(Role.ADMIN), deleteCustomer);

router.route('/:id/follow-ups')
  .get(authorize(Role.ADMIN, Role.SALES, Role.ACCOUNTS), getFollowUps)
  .post(authorize(Role.ADMIN, Role.SALES), addFollowUp);

export default router;
