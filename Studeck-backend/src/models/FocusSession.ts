import mongoose from "mongoose";

const focusSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date }, 
  duration: { type: Number }, 
  mode: { type: String, enum: ["focus", "break"], default: "focus" },
  focusType: {type: String, enum: ["Pomodoro", "Custom"], default: "Custom"},
  notes: { type: String }, 
}, { timestamps: true });

export default mongoose.model("FocusSession", focusSessionSchema);
