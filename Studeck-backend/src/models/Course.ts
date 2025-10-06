import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  userId: mongoose.Types.ObjectId;     // owner
  name: string;
  description?: string;
  color: string;                       // color for course cards
  decks: mongoose.Types.ObjectId[];    // array of deck ids (optional denormalization)
}

const CourseSchema = new Schema<ICourse>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#4169E1' }, // default blue color
  decks: [{ type: Schema.Types.ObjectId, ref: 'Deck' }]
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', CourseSchema);