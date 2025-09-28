// src/controllers/analyticsController.ts
import { Response } from 'express';
import mongoose from 'mongoose';
import Analytics from '../models/Analytics';
import focusSession from '../models/FocusSession';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const getOverview = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const totalFocus = await focusSession.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, minutes: { $sum: '$duration' }, sessions: { $sum: 1 } } }
    ]);
    const since = new Date(); since.setDate(since.getDate() - 7);
    const recent = await Analytics.find({ userId, date: { $gte: since } }).sort({ date: 1 });
    res.json({
      totalFocus: totalFocus[0]?.minutes || 0,
      sessions: totalFocus[0]?.sessions || 0,
      recentAnalytics: recent
    });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const getStreak = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('streak lastLogin');
    res.json({ streak: user?.streak || 0, lastLogin: user?.lastLogin || null });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
