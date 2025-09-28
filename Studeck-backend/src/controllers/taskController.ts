// src/controllers/taskController.ts
import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    const task = await Task.create({ userId: req.user!.id, title, description, dueDate, priority });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const listTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await Task.find({ userId: req.user!.id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    if (task.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    Object.assign(task, req.body);
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    if (task.userId.toString() !== req.user!.id) return res.status(403).json({ message: 'Forbidden' });
    await task.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};
