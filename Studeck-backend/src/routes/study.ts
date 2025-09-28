// src/routes/study.ts
import { Router } from 'express';
import { fetchDueCards, reviewCards } from '../controllers/studyController';
import auth from '../middleware/auth';

const router = Router();
router.get('/due', auth, fetchDueCards);
router.post('/review', auth, reviewCards);
export default router;
