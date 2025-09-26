import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  userId: mongoose.Types.ObjectId;     // owner
  name: string;
  description?: string;
  decks: mongoose.Types.ObjectId[];    // array of deck ids (optional denormalization)
}

const CourseSchema = new Schema<ICourse>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  decks: [{ type: Schema.Types.ObjectId, ref: 'Deck' }]
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', CourseSchema);
