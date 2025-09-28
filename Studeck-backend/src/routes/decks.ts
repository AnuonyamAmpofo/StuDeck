// src/routes/decks.ts
import { Router } from 'express';
import { createDeck, listDecksForCourse, getDeck, updateDeck, deleteDeck } from '../controllers/deckController';
import auth from '../middleware/auth';
const router = Router();
router.post('/courses/:courseId/decks', auth, createDeck); // alternative: nested route
router.get('/courses/:courseId/decks', auth, listDecksForCourse);
router.get('/:id', auth, getDeck);
router.patch('/:id', auth, updateDeck);
router.delete('/:id', auth, deleteDeck);
export default router;
