// src/controllers/focusController.ts
import { Response } from 'express';
import focusSession from '../models/FocusSession';
import { AuthRequest } from '../middleware/auth';

export const startFocus = async (req: AuthRequest, res: Response) => {
  try {
    const { startTime = Date.now(), mode, notes } = req.body;
    const session = await focusSession.create({ userId: req.user!.id, startTime, mode, notes });
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const endFocus = async (req: AuthRequest, res: Response) => {
  try {
    const session = await focusSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Not found' });
    if (session.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    const { endTime = Date.now() } = req.body;
    session.endTime = endTime;
    session.duration = Math.round((new Date(endTime).getTime() - new Date(session.startTime).getTime()) / 60000);
    await session.save();
    res.json(session);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const listFocus = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await focusSession.find({ userId: req.user!.id }).sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
