// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import deckRoutes from './routes/decks';
import cardRoutes from './routes/cards';
import taskRoutes from './routes/tasks';
import focusRoutes from './routes/focus';
import analyticsRoutes from './routes/analytics';
import studyRoutes from './routes/study';
import errorHandler from './middleware/errrorHandler';

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple rate limiter
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

connectDB().catch(err => { console.error(err); process.exit(1); });

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/study', studyRoutes);

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
