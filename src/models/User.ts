import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';
import { BCRYPT_SALT_ROUNDS } from '../utils/constants';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: { type: String },
    role: { type: String, enum: ['patient', 'pharmacy', 'admin'], required: true },
    avatar: { type: String },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: { type: String },
    searchRadius: { type: Number, default: 5, min: 1, max: 10 },
    fcmToken: { type: String },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    googleId: { type: String },
    refreshToken: { type: String, select: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
// email index is already created by `unique: true` on the field

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<UserDocument>('User', userSchema);
