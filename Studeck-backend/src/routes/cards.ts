// src/routes/cards.ts
import { Router } from 'express';
import { createCard, listCardsInDeck, getCard, updateCard, deleteCard } from '../controllers/cardController';

import auth from '../middleware/auth';

const router = Router();
router.post('/decks/:deckId/cards', auth, createCard);
router.get('/decks/:deckId/cards', auth, listCardsInDeck);
router.get('/:id', auth, getCard);
router.patch('/:id', auth, updateCard);
router.delete('/:id', auth, deleteCard);
export default router;
