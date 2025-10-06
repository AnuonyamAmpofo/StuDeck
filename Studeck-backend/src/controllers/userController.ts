// src/controllers/userController.ts
import { Request, Response } from 'express';
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

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).json({ message: 'User created', user: { id: user._id, username, email } });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
