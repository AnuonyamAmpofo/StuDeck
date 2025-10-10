import mongoose, { Document, Schema } from "mongoose";

export interface IStreak extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  streakDays: number;
  lastStudied: Date;
  completedDays: string[]; // e.g. ["Mon", "Tue", "Wed"]
  createdAt: Date;
}

const streakSchema = new Schema<IStreak>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  streakDays: { type: Number, default: 0 },
  lastStudied: { type: Date, required: true },
  completedDays: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IStreak>("Streak", streakSchema);