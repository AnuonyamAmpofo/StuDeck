import Streak from '../models/Streak';
import { Request, Response } from 'express';

// Create a new streak for a user
export const createStreak = async (req: Request, res: Response) => {
  try {
    const { userId, lastStudied, completedDays } = req.body;
    const streak = await Streak.create({
      userId,
      streakDays: 1,
      lastStudied,
      completedDays,
    });
    res.status(201).json(streak);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create streak' });
  }
};

// Get a user's streak
export const getStreak = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const streak = await Streak.findOne({ userId });
    if (!streak) return res.status(404).json({ error: 'Streak not found' });
    res.json(streak);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get streak' });
  }
};

// Update a user's streak
export const updateStreak = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const update = req.body;
    const streak = await Streak.findOneAndUpdate({ userId }, update, { new: true });
    if (!streak) return res.status(404).json({ error: 'Streak not found' });
    res.json(streak);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update streak' });
  }
};

// Update streak only if not updated today
export const updateStreakIfNeeded = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let streak = await Streak.findOne({ userId });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    if (!streak) {
      // Create new streak document if not found
      streak = await Streak.create({
        userId,
        streakDays: 1,
        lastStudied: new Date(),
        completedDays: [today],
      });
      return res.status(201).json({ streakDays: streak.streakDays, completedDays: streak.completedDays });
    }

    if (!streak.completedDays.includes(today)) {
      streak.streakDays += 1;
      streak.completedDays.push(today);
      streak.lastStudied = new Date();
      await streak.save();
    }
    res.json({ streakDays: streak.streakDays, completedDays: streak.completedDays });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update streak' });
  }
};