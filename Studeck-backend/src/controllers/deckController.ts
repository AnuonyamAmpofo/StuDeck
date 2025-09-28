// src/controllers/deckController.ts
import { Response } from 'express';
import Deck from '../models/Deck';
import Course from '../models/Course';
import { AuthRequest } from '../middleware/auth';

export const createDeck = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const { courseId } = req.params; 
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

    const deck = await Deck.create({ title, description, courseId });
    course.decks = course.decks || [];
    course.decks.push(deck._id);
    await course.save();
    res.status(201).json(deck);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const listDecksForCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    const decks = await Deck.find({ courseId }).populate('cards');
    res.json(decks);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const getDeck = async (req: AuthRequest, res: Response) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('cards');
    if (!deck) return res.status(404).json({ message: 'Not found' });
    const course = await Course.findById(deck.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    res.json(deck);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const updateDeck = async (req: AuthRequest, res: Response) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ message: 'Not found' });
    const course = await Course.findById(deck.courseId);
    if (course!.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(deck, req.body);
    await deck.save();
    res.json(deck);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const deleteDeck = async (req: AuthRequest, res: Response) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ message: 'Not found' });
    const course = await Course.findById(deck.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

    await require('../models/Card').deleteMany({ deckId: deck._id });
    await Course.findByIdAndUpdate(course._id, { $pull: { decks: deck._id } });
    await deck.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
