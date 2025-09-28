import mongoose, {Document, Schema} from "mongoose";

export interface IDeck extends Document{
  _id: mongoose.Types.ObjectId;
  title: string;
  courseId: mongoose.Types.ObjectId;
  description?: string;
  cards: mongoose.Types.ObjectId[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId
}

const deckSchema = new Schema<IDeck>({
  title: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  description: { type: String },
  cards: [{ type: Schema.Types.ObjectId, ref: "Card" }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model<IDeck>("Deck", deckSchema);