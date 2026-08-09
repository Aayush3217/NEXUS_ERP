import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createDraftChallan,
  updateDraftChallan,
  confirmChallan,
  cancelDraftChallan,
} from '../controllers/challan';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.route('/')
  .get(getChallans) // all roles can view list
  .post(authorize(Role.ADMIN, Role.SALES), createDraftChallan);

router.route('/:id')
  .get(getChallanById) // all roles can view details
  .put(authorize(Role.ADMIN, Role.SALES), updateDraftChallan);

router.post('/:id/confirm', authorize(Role.ADMIN, Role.SALES), confirmChallan);
router.post('/:id/cancel', authorize(Role.ADMIN, Role.SALES), cancelDraftChallan);

export default router;
