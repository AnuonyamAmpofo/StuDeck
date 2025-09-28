// src/controllers/cardController.ts
import { Response } from 'express';
import Card from '../models/Card';
import Deck from '../models/Deck';
import Course from '../models/Course';
import { AuthRequest } from '../middleware/auth';

export const createCard = async (req: AuthRequest, res: Response) => {
  try {
    const { front, back } = req.body;
    const { deckId } = req.params; // route: POST /decks/:deckId/cards
    const deck = await Deck.findById(deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });
    const course = await Course.findById(deck.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

    const card = await Card.create({ deckId, front, back });
    deck.cards = deck.cards || [];
    deck.cards.push(card._id);
    await deck.save();
    res.status(201).json(card);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const listCardsInDeck = async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const deck = await Deck.findById(deckId);
    if (!deck) return res.status(404).json({ message: 'Deck not found' });
    const course = await Course.findById(deck.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    const cards = await Card.find({ deckId });
    res.json(cards);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const getCard = async (req: AuthRequest, res: Response) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    const deck = await Deck.findById(card.deckId);
    const course = await Course.findById(deck!.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    res.json(card);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    const deck = await Deck.findById(card.deckId);
    const course = await Course.findById(deck!.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(card, req.body);
    await card.save();
    res.json(card);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Not found' });
    const deck = await Deck.findById(card.deckId);
    const course = await Course.findById(deck!.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    await Card.findByIdAndDelete(card._id);
    await Deck.findByIdAndUpdate(deck!._id, { $pull: { cards: card._id } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
