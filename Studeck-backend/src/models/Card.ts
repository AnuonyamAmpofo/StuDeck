import mongoose, { Document, Schema } from "mongoose";

export interface ICard extends Document {
  _id: mongoose.Types.ObjectId;
  front: string;
  back: string;
  deckId: mongoose.Types.ObjectId;
  media?: any[];
  createdAt: Date;

  // spaced repetition fields
  repetition: number;       
  interval: number;         
  easeFactor: number;       
  lastReviewed?: Date;      
  reviewHistory: {
    reviewedAt: Date;
    rating: number;
    interval: number;
    easeFactor: number;
  }[];
}

const reviewHistorySchema = new Schema({
  reviewedAt: { type: Date, required: true },
  rating: { type: Number, required: true },
  interval: { type: Number, required: true },
  easeFactor: { type: Number, required: true },
}, { _id: false });

const cardSchema = new Schema<ICard>({
  front: { type: String, required: true },
  back: { type: String, required: true },
  deckId: { type: Schema.Types.ObjectId, ref: "Deck", required: true },
  media: [{ type: Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },

  repetition: { type: Number, default: 0 },
  interval: { type: Number, default: 1 },
  easeFactor: { type: Number, default: 2.5 },
  lastReviewed: { type: Date },
  reviewHistory: [reviewHistorySchema],
});

export default mongoose.model<ICard>("Card", cardSchema);
