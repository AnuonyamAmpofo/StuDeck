import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  studyMinutes: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  flashcardsReviewed: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Analytics", analyticsSchema);
