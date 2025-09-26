import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  university?: string;
  major?: string;
  streak: number;
  lastLogin?: Date;
  refreshTokens: string[];
  courses: mongoose.Types.ObjectId[];
}

const userSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // hashed
  university: String,
  major: String,
  streak: { type: Number, default: 0 },
  lastLogin: Date,
  refreshTokens: [String],
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
}, { timestamps: true });

export default mongoose.model<IUser>("User", userSchema);
