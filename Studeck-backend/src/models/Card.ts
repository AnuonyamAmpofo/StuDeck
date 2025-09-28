import mongoose, {Document, Schema} from "mongoose";

export interface ICard extends Document{
  _id: mongoose.Types.ObjectId;
  front: string;
  back: string;
  deckId: mongoose.Types.ObjectId;
  media?: any[];
  nextReviewDate?:  Date
  createdAt: Date;
}

const cardSchema = new Schema({
  front: { type: String, required: true },  
  back: { type: String, required: true },   
  deckId: { type: Schema.Types.ObjectId, ref: "Deck" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICard>("Card", cardSchema);