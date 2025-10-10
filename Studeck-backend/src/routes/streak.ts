import { Router } from 'express';
import { createStreak, getStreak, updateStreak, updateStreakIfNeeded } from '../controllers/streakController';
import auth from '../middleware/auth';

const router = Router();

router.post('/', auth, createStreak);
router.get('/:userId', auth, getStreak);
router.patch('/:userId', auth, updateStreak);
router.post('/:userId/update', updateStreakIfNeeded);

export default router;