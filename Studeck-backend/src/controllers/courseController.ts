// src/controllers/courseController.ts
import { Response } from 'express';
import Course from '../models/Course';
import Deck from '../models/Deck';
import { AuthRequest } from '../middleware/auth';

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const course = await Course.create({ userId: req.user!.id, name, description });
    res.status(201).json(course);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const listCourses = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ userId: req.user!.id }).populate('decks');
    res.json(courses);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const getCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findById(req.params.id).populate('decks');
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    res.json(course);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const updateCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(course, req.body);
    await course.save();
    res.json(course);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const deleteCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (course.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });

    // cascade delete decks and cards
    const decks = await Deck.find({ courseId: course._id });
    for (const d of decks) {
      await require('../models/Card').deleteMany({ deckId: d._id });
    }
    await Deck.deleteMany({ courseId: course._id });
    await course.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
