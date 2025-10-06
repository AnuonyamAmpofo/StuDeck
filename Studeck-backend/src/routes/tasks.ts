// src/routes/tasks.ts
import { Router } from 'express';
import { createTask, listTasks, updateTask, deleteTask } from '../controllers/taskController';
import auth from '../middleware/auth';

const router = Router();
router.post('/', auth, createTask);
router.get('/', auth, listTasks);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);
export default router;