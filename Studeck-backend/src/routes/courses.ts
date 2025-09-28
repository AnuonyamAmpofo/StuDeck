// src/routes/courses.ts
import { Router } from 'express';
import { createCourse, listCourses, getCourse, updateCourse, deleteCourse } from '../controllers/courseController';
import auth from '../middleware/auth';


const router = Router();
router.post('/', auth, createCourse);
router.get('/', auth, listCourses);
router.get('/:id', auth, getCourse);
router.patch('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);

export default router;
