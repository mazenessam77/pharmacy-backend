import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User';
import { Pharmacy } from '../models/Pharmacy';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashToken, generateResetToken } from '../utils/helpers';
import { sendPasswordResetEmail } from '../services/email.service';
import { ERROR_CODES, BCRYPT_SALT_ROUNDS } from '../utils/constants';
import { env } from '../config/env';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role, pharmacyName, license, governorate, address, workingHours } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered.', 409, ERROR_CODES.USER_EXISTS);
  }

  const userData: any = {
    name,
    email,
    password,
    phone,
    role,
    address,
  };

  const user = await User.create(userData);

  // If pharmacy role, create pharmacy profile
  if (role === 'pharmacy') {
    await Pharmacy.create({
      userId: user._id,
      pharmacyName,
      license,
      governorate: governorate || 'Giza',
      location: { type: 'Point', coordinates: [31.2357, 30.0444] },
      workingHours: workingHours || {},
    });
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  // Store hashed refresh token
  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete (userResponse as any).password;
  delete (userResponse as any).refreshToken;

  res.status(201).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: userResponse,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password.', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  if (user.isBanned) {
    throw new AppError('Your account has been banned.', 403, ERROR_CODES.USER_BANNED);
  }

  const isMatch = await (user as any).comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete (userResponse as any).password;
  delete (userResponse as any).refreshToken;

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: userResponse,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  }

  res.json({ success: true, data: { message: 'Logged out successfully.' } });
});

export const refreshTokenHandler = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400, ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const user = await User.findOne({ _id: decoded.id, refreshToken: hashedToken }).select('+refreshToken');
  if (!user) {
    throw new AppError('Invalid refresh token.', 401, ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  const newAccessToken = generateAccessToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether user exists
    res.json({ success: true, data: { message: 'If the email exists, a reset link has been sent.' } });
    return;
  }

  const resetToken = generateResetToken();
  user.resetPasswordToken = hashToken(resetToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetEmail(email, resetToken);

  res.json({ success: true, data: { message: 'If the email exists, a reset link has been sent.' } });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token.', 400, ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshToken = undefined;
  await user.save();

  res.json({ success: true, data: { message: 'Password reset successful. Please log in.' } });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;

  let pharmacyProfile = null;
  if (user.role === 'pharmacy') {
    pharmacyProfile = await Pharmacy.findOne({ userId: user._id });
  }

  res.json({
    success: true,
    data: {
      user,
      pharmacyProfile,
    },
  });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;

  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google token.', 401, ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  if (!payload || !payload.email) {
    throw new AppError('Unable to get user info from Google.', 401, ERROR_CODES.AUTH_INVALID_TOKEN);
  }

  const { sub: googleId, email, name, picture } = payload;

  // Find existing user by googleId or email
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Link google account if not already linked
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save({ validateBeforeSave: false });
    }

    if (user.isBanned) {
      throw new AppError('Your account has been banned.', 403, ERROR_CODES.USER_BANNED);
    }
  } else {
    // Create new user
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: picture,
      role: 'patient',
    });
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  const userResponse = user.toObject();
  delete (userResponse as any).password;
  delete (userResponse as any).refreshToken;

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: userResponse,
    },
  });
});
