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
  console.log('reviewCards called, req.body:', req.body);
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
      const card = await Card.findById(r.cardId);
      if (!card) continue;

      let { repetition, interval, easeFactor } = card;

      if (r.rating === 0) { // Again
        repetition = 0;
        interval = 1;
      } else if (r.rating === 1) { // Hard
        // DO NOT reset repetition!
        interval = Math.max(1, Math.round(interval * 1.2));
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        // repetition stays the same
      } else if (r.rating === 2 || r.rating === 3) { // Good or Easy
        if (repetition === 0) {
          interval = 1;
        } else if (repetition === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetition += 1;
        easeFactor = easeFactor + (0.1 - (5 - (r.rating + 2)) * (0.08 + (5 - (r.rating + 2)) * 0.02));
        if (easeFactor < 1.3) easeFactor = 1.3;
      }

      card.repetition = repetition;
      card.interval = interval;
      card.easeFactor = easeFactor;
      card.lastReviewed = new Date();
      card.reviewHistory.push({
        reviewedAt: card.lastReviewed,
        rating: r.rating,
        interval,
        easeFactor
      });
      await card.save();
      results.push({
        cardId: card._id,
        repetition,
        interval,
        easeFactor,
        lastReviewed: card.lastReviewed,
        reviewHistory: card.reviewHistory
      });
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

export const fetchAllCardsForDeck = async (req: AuthRequest, res: Response) => {
  try {
    const { deckId } = req.params;
    const cards = await Card.find({ deckId });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
