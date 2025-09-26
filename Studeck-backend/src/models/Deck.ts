import mongoose, {Document, Schema} from "mongoose";

export interface IDeck extends Document{
  title: string;
  courseId: mongoose.Types.ObjectId;
  description?: string;
  cards: mongoose.Types.ObjectId[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId
}

const deckSchema = new Schema({
  title: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  description: String,
  cards: [{ type: Schema.Types.ObjectId, ref: "Card" }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" }

}, { timestamps: true });

export default mongoose.model<IDeck>("Deck", deckSchema);