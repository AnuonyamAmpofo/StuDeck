// src/controllers/studyController.ts
import { Response } from 'express';
import mongoose from 'mongoose';
import Card from '../models/Card';
import Deck from '../models/Deck';
import Course from '../models/Course';
import { reviewCard, ReviewRating } from '../utils/sm2';
import { AuthRequest } from '../middleware/auth';

// helper: milliseconds in a day
const DAY_MS = 24 * 60 * 60 * 1000;

export const fetchDueCards = async (req: AuthRequest, res: Response) => {
  try {
    const { deckIds, limit = '50' } = req.query;
    const ids = typeof deckIds === 'string' && deckIds ? deckIds.split(',').map(d => new mongoose.Types.ObjectId(d)) : undefined;

    const now = new Date();
    const match: any = {};
    if (ids) match.deckId = { $in: ids };

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'decks',
          localField: 'deckId',
          foreignField: '_id',
          as: 'deck'
        }
      },
      { $unwind: '$deck' },
      {
        $lookup: {
          from: 'courses',
          localField: 'deck.courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $match: { 'course.userId': new mongoose.Types.ObjectId(req.user!.id) } },
      { $addFields: {
          lastReviewed: { $ifNull: ['$lastReviewed', new Date(0)] },
          nextReviewAt: {
            $cond: [
              { $gt: ['$lastReviewed', new Date(0)] },
              { $add: ['$lastReviewed', { $multiply: ['$interval', DAY_MS] }] },
              new Date(0)
            ]
          }
        }
      },
      { $match: { $or: [ { lastReviewed: new Date(0) }, { nextReviewAt: { $lte: now } } ] } },
      { $sort: { nextReviewAt: 1, createdAt: 1 } },
      { $limit: parseInt(limit as string, 10) }
    ];

    const cards = await Card.aggregate(pipeline).exec();
    res.json(cards);
  } catch (err) { res.status(500).json({ message: (err as Error).message }); }
};

export const reviewCards = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reviews } = req.body as { reviews: { cardId: string; rating: ReviewRating }[] };
    if (!Array.isArray(reviews) || reviews.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'reviews array required' });
    }

    const results: any[] = [];
    for (const r of reviews) {
      const card = await Card.findById(r.cardId).session(session);
      if (!card) continue;

      const deck = await Deck.findById(card.deckId).session(session);
      if (!deck) throw new Error('Deck not found');
      const course = await Course.findById(deck.courseId).session(session);
      if (!course) throw new Error('Course not found');
      if (course.userId.toString() !== req.user!.id) throw new Error('Forbidden');

      const curState = { repetition: card.repetition || 0, interval: card.interval || 1, easeFactor: card.easeFactor || 2.5 };
      const reviewed = reviewCard(curState, r.rating);

      card.repetition = reviewed.repetition;
      card.interval = reviewed.interval;
      card.easeFactor = reviewed.easeFactor;
      card.lastReviewed = new Date();
      card.reviewHistory = card.reviewHistory || [];
      card.reviewHistory.push({
        reviewedAt: card.lastReviewed,
        rating: r.rating,
        interval: reviewed.interval,
        easeFactor: reviewed.easeFactor
      });

      await card.save({ session });
      results.push({ cardId: card._id, repetition: card.repetition, interval: card.interval, easeFactor: card.easeFactor });
    }

    await session.commitTransaction();
    session.endSession();
    res.json({ updated: results.length, results });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: (err as Error).message });
  }
};
