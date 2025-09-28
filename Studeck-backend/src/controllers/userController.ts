// src/controllers/userController.ts
import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password -refreshTokens');
    res.json(user);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const updates: any = { ...req.body };
    if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
    const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true }).select('-password -refreshTokens');
    res.json(user);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const deleteMe = async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndDelete(req.user!.id);
    res.json({ message: 'Account deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
