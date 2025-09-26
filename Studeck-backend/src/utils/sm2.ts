// utils/sm2.ts

export type ReviewRating = 0 | 1 | 2 | 3; 
// 0 = Again, 1 = Hard, 2 = Good, 3 = Easy

export interface CardState {
  repetition: number;     // how many times answered correctly
  interval: number;       // current interval in days
  easeFactor: number;     // growth multiplier (default: 2.5)
  lastReviewed?: Date;    // last review timestamp
}

export function reviewCard(
  state: CardState,
  rating: ReviewRating
): CardState {
  let { repetition, interval, easeFactor } = state;

  if (rating === 0) {
    // "Again" → reset repetition and interval
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval = 1; // first successful review
    } else if (repetition === 2) {
      interval = 6; // second successful review
    } else {
      interval = Math.round(interval * easeFactor);
    }

    // adjust ease factor based on difficulty
    if (rating === 1) easeFactor = Math.max(1.3, easeFactor - 0.15); // Hard
    if (rating === 2) easeFactor = easeFactor;                        // Good
    if (rating === 3) easeFactor = easeFactor + 0.15;                 // Easy
  }

  return {
    repetition,
    interval,
    easeFactor,
    lastReviewed: new Date()
  };
}
