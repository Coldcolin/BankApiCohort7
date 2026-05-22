import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    amountAllowable: { type: Number, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
