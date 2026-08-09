import { Router } from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/recent-activity', getRecentActivity);

export default router;
