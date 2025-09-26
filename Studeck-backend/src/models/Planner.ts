import mongoose from 'mongoose';

const plannerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  start: { type: Date, required: true },
  end: Date,
  type: { type: String, enum: ["study", "event", "reminder"], default: "study" },
}, { timestamps: true });

export default mongoose.model("Planner", plannerSchema);
