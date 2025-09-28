// src/routes/analytics.ts
import { Router } from 'express';
import { getOverview, getStreak } from '../controllers/analyticsController';
import auth from '../middleware/auth';

const router = Router();
router.get('/overview', auth, getOverview);
router.get('/streak', auth, getStreak);
export default router;
